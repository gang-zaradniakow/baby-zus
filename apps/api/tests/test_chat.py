"""ZUS-43: POST /chat – asystent, historia sesji, timeout, analityka (TA-19…TA-24)."""

import asyncio
import uuid
from collections.abc import AsyncIterator, Callable, Iterator
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import pytest
from fastapi.testclient import TestClient

from api.db import migrate
from api.db.conversation_repository import SqlConversationRepository
from api.db.engine import create_engine, create_sessionmaker
from api.db.models import MessageRole
from api.main import create_app
from api.services.assistant import build_assistant
from api.services.conversations import (
    AnalyticsRecord,
    ConversationRepository,
    InMemoryConversationRepository,
)
from api.services.sessions import InMemorySessionRepository
from api.settings import Settings
from api.testing import FakeClock
from assistant.answer import ChatAnswer
from assistant.orchestrator import ChatContext, Orchestrator
from contracts import AnswerCard
from profile_source import MockProfileSource
from profile_source.personas import load_persona
from rules_engine.evaluate import evaluate

ROOT = Path(__file__).resolve().parents[3]
PERSONAS = ROOT / "data" / "personas"
UNREACHABLE_DB = "postgresql+asyncpg://zus:zus@127.0.0.1:1/zus"
NOW = datetime(2026, 11, 22, 9, tzinfo=UTC)

FORM = {
    "applicant": {"role": "MOTHER", "insurance": {"periods": []}},
    "child": {"expectedBirthDate": "2027-03-01"},
}


class FakeAssistant:
    """Atrapa asystenta: zapisuje pytania i kontekst, odpowiada kartą T01 albo zachowaniem."""

    def __init__(self, behaviour: Callable[[str], Any] | None = None) -> None:
        self.calls: list[tuple[str, ChatContext]] = []
        self.behaviour = behaviour

    async def answer(self, question: str, context: ChatContext) -> ChatAnswer:
        self.calls.append((question, context))
        if self.behaviour is not None:
            result = self.behaviour(question)
            if asyncio.iscoroutine(result):
                return await result
            return result
        persona = load_persona(next(PERSONAS.glob("T01_*.json")))
        card = evaluate("B.01_wysokosc_macierzynskiego", persona.profile, persona.today)
        assert isinstance(card, AnswerCard)
        return ChatAnswer(
            kind="CARD",
            intent_id=card.intent_id,
            message=card.summary,
            card=card,
            actions=card.actions,
        )


@pytest.fixture
def conversations() -> InMemoryConversationRepository:
    return InMemoryConversationRepository()


def make_client(
    assistant: Any, conversations: ConversationRepository, *, timeout_s: float = 5.0
) -> TestClient:
    app = create_app(
        Settings(database_url=UNREACHABLE_DB, chat_timeout_s=timeout_s),
        profile_source=MockProfileSource.from_personas(PERSONAS),
        sessions=InMemorySessionRepository(),
        conversations=conversations,
        assistant=assistant,
        clock=FakeClock(NOW),
    )
    return TestClient(app, raise_server_exceptions=False)


@pytest.fixture
def assistant() -> FakeAssistant:
    return FakeAssistant()


@pytest.fixture
def client(
    assistant: FakeAssistant, conversations: InMemoryConversationRepository
) -> Iterator[TestClient]:
    with make_client(assistant, conversations) as test_client:
        yield test_client


def login(client: TestClient, user_ref: str = "persona-t01") -> dict[str, str]:
    token = client.post("/auth/mobywatel", json={"userRef": user_ref}).json()["token"]
    return {"Authorization": f"Bearer {token}"}


def anonymous(client: TestClient) -> dict[str, str]:
    token = client.post("/auth/anonymous", json=FORM).json()["token"]
    return {"Authorization": f"Bearer {token}"}


# --- TA-19 ------------------------------------------------------------------------------------


def test_ta19_chat_goes_to_assistant_and_is_recorded(
    client: TestClient, assistant: FakeAssistant, conversations: InMemoryConversationRepository
) -> None:
    headers = login(client)
    response = client.post("/chat", json={"message": "Ile wyniesie mój zasiłek?"}, headers=headers)
    assert response.status_code == 200
    body = response.json()
    assert body["seq"] == 2
    assert body["answer"]["kind"] == "CARD"
    assert body["answer"]["card"]["intentId"] == "B.01_wysokosc_macierzynskiego"

    question, context = assistant.calls[0]
    assert question == "Ile wyniesie mój zasiłek?"
    assert context.user_ref == "persona-t01"
    assert context.zus_data is True
    assert context.profile is None
    assert context.session_id is not None

    [event] = conversations.events
    assert (event.level, event.event_type, event.intent_id, event.verdict) == (
        2,
        "CHAT_CARD",
        "B.01_wysokosc_macierzynskiego",
        "YES",
    )
    assert "Ile wyniesie" not in str(event)  # analityka bez treści pytania


def test_form_session_passes_profile_without_zus_data(
    client: TestClient, assistant: FakeAssistant
) -> None:
    client.post("/chat", json={"message": "pytanie"}, headers=anonymous(client))
    _, context = assistant.calls[0]
    assert context.zus_data is False
    assert context.profile is not None
    assert context.user_ref.startswith("anon-")


# --- TA-20 / TA-21 ----------------------------------------------------------------------------


async def _slow(question: str) -> ChatAnswer:
    await asyncio.sleep(5)
    raise AssertionError("nie powinno dojść do odpowiedzi")


def test_ta20_timeout_gives_504_with_escalation(
    conversations: InMemoryConversationRepository,
) -> None:
    with make_client(FakeAssistant(_slow), conversations, timeout_s=0.1) as client:
        headers = login(client)
        response = client.post("/chat", json={"message": "Ile dostanę?"}, headers=headers)
        assert response.status_code == 504
        body = response.json()
        assert body["code"] == "ASSISTANT_TIMEOUT"
        assert body["details"] == [
            {"action": {"type": "ESCALATE", "label": "Zapytaj urzędnika ZUS", "ref": None}}
        ]
        history = client.get("/chat/history", headers=headers).json()
    assert [item["role"] for item in history] == ["USER", "ASSISTANT"]
    assert conversations.events[-1].event_type == "CHAT_TIMEOUT"


def _boom(question: str) -> ChatAnswer:
    raise RuntimeError("klucz sk-tajny w stack trace")


def test_ta21_assistant_exception_gives_502_with_escalation(
    conversations: InMemoryConversationRepository,
) -> None:
    with make_client(FakeAssistant(_boom), conversations) as client:
        response = client.post("/chat", json={"message": "Ile dostanę?"}, headers=login(client))
    assert response.status_code == 502
    assert response.json()["code"] == "ASSISTANT_ERROR"
    assert response.json()["details"][0]["action"]["type"] == "ESCALATE"
    assert "sk-tajny" not in response.text
    assert conversations.events[-1].event_type == "CHAT_ERROR"


def test_disabled_assistant_is_503(conversations: InMemoryConversationRepository) -> None:
    app = create_app(
        Settings(database_url=UNREACHABLE_DB),
        profile_source=MockProfileSource.from_personas(PERSONAS),
        sessions=InMemorySessionRepository(),
        conversations=conversations,
        clock=FakeClock(NOW),
    )
    with TestClient(app) as client:
        response = client.post("/chat", json={"message": "x"}, headers=login(client))
    assert response.status_code == 503
    assert response.json()["code"] == "ASSISTANT_UNAVAILABLE"


# --- TA-22 / TA-23 ----------------------------------------------------------------------------


def test_ta22_history_in_order(client: TestClient) -> None:
    headers = login(client)
    for text in ("pierwsze", "drugie", "trzecie"):
        client.post("/chat", json={"message": text}, headers=headers)
    history = client.get("/chat/history", headers=headers).json()
    assert [item["seq"] for item in history] == [1, 2, 3, 4, 5, 6]
    assert [item["content"] for item in history if item["role"] == "USER"] == [
        "pierwsze",
        "drugie",
        "trzecie",
    ]
    assistant_items = [item for item in history if item["role"] == "ASSISTANT"]
    assert all(item["intentId"] == "B.01_wysokosc_macierzynskiego" for item in assistant_items)
    assert assistant_items[0]["card"]["verdict"] == "YES"


def test_ta23_sessions_are_isolated(client: TestClient) -> None:
    first, second = login(client, "persona-t01"), login(client, "persona-t02")
    client.post("/chat", json={"message": "tajne pytanie A"}, headers=first)
    assert client.get("/chat/history", headers=second).json() == []
    assert len(client.get("/chat/history", headers=first).json()) == 2


def test_chat_requires_session(client: TestClient) -> None:
    assert client.post("/chat", json={"message": "x"}).status_code == 401
    assert client.get("/chat/history").status_code == 401


# --- TA-24 ------------------------------------------------------------------------------------


@pytest.mark.parametrize(
    "body",
    [
        {"message": ""},
        {"message": "   "},
        {"message": "x" * 2001},
        {"message": "ok", "intentId": "B.01"},
        {},
    ],
)
def test_ta24_message_validation(
    client: TestClient, assistant: FakeAssistant, body: dict[str, Any]
) -> None:
    response = client.post("/chat", json=body, headers=login(client))
    assert response.status_code == 422
    assert response.json()["code"] == "VALIDATION_ERROR"
    assert assistant.calls == []


def test_message_of_max_length_is_accepted(client: TestClient) -> None:
    response = client.post("/chat", json={"message": "x" * 2000}, headers=login(client))
    assert response.status_code == 200


# --- budowa asystenta z konfiguracji -----------------------------------------------------------


def test_build_assistant_from_environment(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("MCP_TOKEN_SECRET", "test-secret-0123456789")
    monkeypatch.setenv("LLM_PROVIDER", "fake")
    built = build_assistant(lambda: NOW)
    assert isinstance(built, Orchestrator)
    assert built._today().isoformat() == "2026-11-22"


def test_build_assistant_with_bad_configuration_is_disabled(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("MCP_TOKEN_SECRET", "krotki")
    assert build_assistant(lambda: NOW) is None


# --- repozytorium rozmowy: w pamięci i SQL ----------------------------------------------------


@pytest.fixture(params=["memory", pytest.param("sql", marks=pytest.mark.integration)])
async def repository(request: pytest.FixtureRequest) -> AsyncIterator[ConversationRepository]:
    if request.param == "memory":
        yield InMemoryConversationRepository()
        return
    url: str = request.getfixturevalue("pg_url")
    migrate.upgrade(url)
    engine = create_engine(url)
    from api.db.models import AuthMode
    from api.db.session_repository import SqlSessionRepository
    from api.services.sessions import hash_token, new_token

    sessions = SqlSessionRepository(create_sessionmaker(engine))
    record = await sessions.create(
        token_hash=hash_token(new_token()),
        user_ref="u",
        auth_mode=AuthMode.MOBYWATEL,
        profile=None,
        created_at=NOW,
        expires_at=NOW,
    )
    request.node.session_id = record.id
    yield SqlConversationRepository(create_sessionmaker(engine))
    await engine.dispose()


async def test_repository_appends_in_order_and_records_events(
    repository: ConversationRepository, request: pytest.FixtureRequest
) -> None:
    session_id = getattr(request.node, "session_id", uuid.uuid4())
    first = await repository.append_message(
        session_id, role=MessageRole.USER, level=2, content="a", created_at=NOW
    )
    second = await repository.append_message(
        session_id,
        role=MessageRole.ASSISTANT,
        level=2,
        content="b",
        created_at=NOW,
        intent_id="C.01_wymiar_macierzynskiego",
        card={"verdict": "YES"},
    )
    assert (first.seq, second.seq) == (1, 2)
    listed = await repository.list_messages(session_id)
    assert [m.content for m in listed] == ["a", "b"]
    assert listed[1].card == {"verdict": "YES"}
    assert await repository.list_messages(uuid.uuid4()) == []
    await repository.record_event(
        AnalyticsRecord(session_id, 2, "CHAT_CARD", "C.01_wymiar_macierzynskiego", "YES", None, NOW)
    )
