"""ZUS-44: reguły eskalacji §8.1, paczka dla urzędnika – szkic, akceptacja, wysyłka (TA-25…30)."""

import asyncio
import json
import uuid
from collections.abc import AsyncIterator, Callable, Iterator
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import pytest
from fastapi.testclient import TestClient

from api.db import migrate
from api.db.engine import create_engine, create_sessionmaker
from api.db.escalation_repository import SqlEscalationRepository
from api.db.models import AuthMode, EscalationChannel, EscalationStatus
from api.main import create_app
from api.services.assistant import build_escalation_sender, build_llm
from api.services.conversations import InMemoryConversationRepository
from api.services.escalation_rules import (
    DIFFICULT_REASON,
    DISPUTE_REASON,
    TWO_NEED_INFO,
    escalation_reason,
)
from api.services.escalation_sender import McpEscalationSender, message_text
from api.services.escalations import EscalationRepository, InMemoryEscalationRepository
from api.services.sessions import InMemorySessionRepository
from api.settings import Settings
from api.testing import FakeClock
from assistant.answer import ChatAnswer
from assistant.escalation import Channel, EngineResult, EscalationPackage
from assistant.llm import FakeLLMClient
from assistant.orchestrator import ChatContext
from assistant.tools import FakeToolClient, ToolCallError
from contracts import AnswerCard, GeneratedBy, Profile, Verdict
from contracts.access_token import Principal
from profile_source import MockProfileSource
from profile_source.personas import load_persona
from rules_engine.evaluate import evaluate

ROOT = Path(__file__).resolve().parents[3]
PERSONAS = ROOT / "data" / "personas"
UNREACHABLE_DB = "postgresql+asyncpg://zus:zus@127.0.0.1:1/zus"
NOW = datetime(2026, 11, 22, 9, tzinfo=UTC)


def persona(number: int) -> Profile:
    return load_persona(next(PERSONAS.glob(f"T{number:02d}_*.json"))).profile


def card_answer(intent_id: str, profile: Profile, *, difficult: bool = False) -> ChatAnswer:
    card = evaluate(intent_id, profile, NOW.date())
    assert isinstance(card, AnswerCard)
    return ChatAnswer(
        kind="CARD",
        intent_id=intent_id,
        message=card.summary,
        card=card,
        actions=card.actions,
        difficult=difficult,
    )


NO_BIRTH = persona(1).model_copy(
    update={"child": persona(1).child.model_copy(update={"birth_date": None})}
)


class ScriptedAssistant:
    def __init__(self, answers: list[ChatAnswer]) -> None:
        self.answers = answers

    async def answer(self, question: str, context: ChatContext) -> ChatAnswer:
        return self.answers.pop(0)


class RecordingSender:
    def __init__(self, fail: bool = False) -> None:
        self.sent: list[tuple[Principal, EscalationPackage]] = []
        self.fail = fail

    async def send(self, principal: Principal, package: EscalationPackage) -> str:
        await asyncio.sleep(0)
        if self.fail:
            raise ToolCallError("zus-pue", "send_question", "UNAVAILABLE")
        self.sent.append((principal, package))
        return f"SPR-SIM-{len(self.sent):06d}"


SUMMARY_LLM: Callable[[], FakeLLMClient] = lambda: FakeLLMClient(  # noqa: E731
    lambda messages: json.dumps({"summary": "Użytkowniczka pyta o wysokość zasiłku."})
)


@pytest.fixture
def sender() -> RecordingSender:
    return RecordingSender()


def make_client(
    answers: list[ChatAnswer],
    sender: Any,
    *,
    llm: FakeLLMClient | None = None,
) -> TestClient:
    app = create_app(
        Settings(database_url=UNREACHABLE_DB),
        profile_source=MockProfileSource.from_personas(PERSONAS),
        sessions=InMemorySessionRepository(),
        conversations=InMemoryConversationRepository(),
        assistant=ScriptedAssistant(answers),
        escalation_repository=InMemoryEscalationRepository(),
        llm=llm or SUMMARY_LLM(),
        escalation_sender=sender,
        clock=FakeClock(NOW),
    )
    return TestClient(app, raise_server_exceptions=False)


@pytest.fixture
def client(sender: RecordingSender) -> Iterator[TestClient]:
    answers = [card_answer("B.01_wysokosc_macierzynskiego", persona(1))]
    with make_client(answers, sender) as test_client:
        yield test_client


def login(client: TestClient, user_ref: str = "persona-t01") -> dict[str, str]:
    token = client.post("/auth/mobywatel", json={"userRef": user_ref}).json()["token"]
    return {"Authorization": f"Bearer {token}"}


# --- TA-25: szkic z polami §8.2 ----------------------------------------------------------------


def test_ta25_draft_contains_section_8_2_package(client: TestClient) -> None:
    headers = login(client)
    client.post("/chat", json={"message": "Ile wyniesie mój zasiłek?"}, headers=headers)
    response = client.post("/escalations/draft", json={"channel": "PUE_MESSAGE"}, headers=headers)
    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "DRAFT"
    assert body["externalCaseId"] is None
    package = body["package"]
    assert package["question"] == "Ile wyniesie mój zasiłek?"  # ostatnie pytanie z czatu
    assert package["summary"] == "Użytkowniczka pyta o wysokość zasiłku."
    assert package["summaryGeneratedBy"] == "LLM_EXPLAINED"
    assert package["profile"]["stage"] == {"stage": "E2", "flags": []}
    assert package["profile"]["insuranceTitles"] == ["EMPLOYMENT"]
    assert [r["intentId"] for r in package["engineResults"]] == ["B.01_wysokosc_macierzynskiego"]
    assert package["reason"] == "Użytkownik poprosił o kontakt z urzędnikiem."
    assert package["channel"] == "PUE_MESSAGE"
    assert {"missingOrConflicting", "documents"} <= set(package)
    assert client.get(f"/escalations/{body['id']}", headers=headers).json() == body


def test_draft_with_own_question_and_form_profile(client: TestClient) -> None:
    form = {"applicant": {"role": "MOTHER"}, "child": {"expectedBirthDate": "2027-03-01"}}
    token = client.post("/auth/anonymous", json=form).json()["token"]
    headers = {"Authorization": f"Bearer {token}"}
    body = client.post(
        "/escalations/draft",
        json={"channel": "EVISIT", "question": "Chcę porozmawiać.", "reason": "Prośba."},
        headers=headers,
    ).json()
    assert body["package"]["question"] == "Chcę porozmawiać."
    assert body["package"]["profile"]["stage"]["stage"] == "E0"
    assert body["package"]["engineResults"] == []


def test_draft_without_any_question_is_422(client: TestClient) -> None:
    response = client.post("/escalations/draft", json={}, headers=login(client))
    assert response.status_code == 422
    assert response.json()["code"] == "QUESTION_REQUIRED"


def test_draft_without_profile_when_source_fails(sender: RecordingSender) -> None:
    with make_client([], sender) as client:
        headers = login(client)
        client.app.state.profile_source = _BrokenSource()  # type: ignore[attr-defined]
        body = client.post(
            "/escalations/draft", json={"question": "Pomocy"}, headers=headers
        ).json()
    assert body["package"]["profile"] is None


class _BrokenSource:
    async def get_profile(self, user_ref: str) -> Profile:
        from profile_source import BackendUnavailableError

        raise BackendUnavailableError("timeout", 3)

    async def get_child_stage(self, user_ref: str) -> Any:
        raise AssertionError

    async def get_partner_profile(self, user_ref: str) -> Any:
        raise AssertionError

    async def aclose(self) -> None:
        return None


# --- TA-26 / TA-27: akceptacja i idempotencja --------------------------------------------------


def test_ta26_nothing_is_sent_without_confirmation(
    client: TestClient, sender: RecordingSender
) -> None:
    headers = login(client)
    client.post("/escalations/draft", json={"question": "Pytanie"}, headers=headers)
    client.post("/escalations/draft", json={"question": "Drugie"}, headers=headers)
    assert sender.sent == []


def test_ta27_confirm_sends_once_and_is_idempotent(
    client: TestClient, sender: RecordingSender
) -> None:
    headers = login(client)
    draft = client.post("/escalations/draft", json={"question": "Pytanie"}, headers=headers).json()
    first = client.post(f"/escalations/{draft['id']}/confirm", headers=headers)
    second = client.post(f"/escalations/{draft['id']}/confirm", headers=headers)
    assert first.status_code == second.status_code == 200
    assert first.json() == second.json()
    assert first.json()["status"] == "SENT"
    assert first.json()["externalCaseId"] == "SPR-SIM-000001"
    assert len(sender.sent) == 1
    principal, package = sender.sent[0]
    assert principal.user_ref == "persona-t01"
    assert package.question == "Pytanie"


def test_failed_send_keeps_draft_for_retry() -> None:
    failing = RecordingSender(fail=True)
    with make_client([], failing) as client:
        headers = login(client)
        draft = client.post("/escalations/draft", json={"question": "P"}, headers=headers).json()
        response = client.post(f"/escalations/{draft['id']}/confirm", headers=headers)
        assert response.status_code == 502
        assert response.json()["code"] == "ESCALATION_SEND_FAILED"
        assert (
            client.get(f"/escalations/{draft['id']}", headers=headers).json()["status"] == "DRAFT"
        )


def test_escalation_of_other_session_is_not_visible(client: TestClient) -> None:
    owner = login(client, "persona-t01")
    draft = client.post("/escalations/draft", json={"question": "P"}, headers=owner).json()
    stranger = login(client, "persona-t02")
    for response in (
        client.get(f"/escalations/{draft['id']}", headers=stranger),
        client.post(f"/escalations/{draft['id']}/confirm", headers=stranger),
        client.get("/escalations/nie-uuid", headers=owner),
        client.get(f"/escalations/{uuid.uuid4()}", headers=owner),
    ):
        assert response.status_code == 404
        assert response.json()["code"] == "ESCALATION_NOT_FOUND"


async def test_concurrent_confirmations_send_once() -> None:
    repository = InMemoryEscalationRepository()
    record = await repository.create(
        session_id=uuid.uuid4(),
        channel=EscalationChannel.PUE_MESSAGE,
        summary="s",
        package={},
        created_at=NOW,
    )
    results = await asyncio.gather(*(repository.claim(record.id, NOW) for _ in range(5)))
    assert sorted(results) == [False, False, False, False, True]


def test_claimed_escalation_is_in_progress(sender: RecordingSender) -> None:
    with make_client([], sender) as client:
        headers = login(client)
        draft = client.post("/escalations/draft", json={"question": "P"}, headers=headers).json()
        repository: InMemoryEscalationRepository = client.app.state.escalations  # type: ignore[attr-defined]
        asyncio.run(repository.claim(uuid.UUID(draft["id"]), NOW))
        response = client.post(f"/escalations/{draft['id']}/confirm", headers=headers)
    assert response.status_code == 409


def test_disabled_llm_or_sender_is_503() -> None:
    app = create_app(
        Settings(database_url=UNREACHABLE_DB),
        profile_source=MockProfileSource.from_personas(PERSONAS),
        sessions=InMemorySessionRepository(),
        conversations=InMemoryConversationRepository(),
        escalation_repository=InMemoryEscalationRepository(),
        clock=FakeClock(NOW),
    )
    with TestClient(app) as client:
        client.app.state.llm = None  # type: ignore[attr-defined]
        headers = login(client)
        assert (
            client.post("/escalations/draft", json={"question": "P"}, headers=headers).status_code
            == 503
        )
        client.app.state.llm = SUMMARY_LLM()  # type: ignore[attr-defined]
        draft = client.post("/escalations/draft", json={"question": "P"}, headers=headers).json()
        response = client.post(f"/escalations/{draft['id']}/confirm", headers=headers)
    assert response.status_code == 503
    assert response.json()["code"] == "ESCALATION_UNAVAILABLE"


# --- TA-28…TA-30: reguły §8.1 ------------------------------------------------------------------


def test_ta28_two_need_info_in_a_row_propose_escalation(sender: RecordingSender) -> None:
    answers = [
        card_answer("A.01_prawo_do_macierzynskiego", NO_BIRTH),
        card_answer("C.01_wymiar_macierzynskiego", NO_BIRTH),
    ]
    with make_client(answers, sender) as client:
        headers = login(client)
        first = client.post("/chat", json={"message": "Czy dostanę?"}, headers=headers).json()
        second = client.post("/chat", json={"message": "Ile urlopu?"}, headers=headers).json()
    assert first["answer"]["card"]["verdict"] == "NEED_INFO"
    assert first["escalation"] is None
    assert second["escalation"] == {
        "reason": TWO_NEED_INFO,
        "action": {"type": "ESCALATE", "label": "Zapytaj urzędnika ZUS", "ref": None},
    }


def test_ta29_low_confidence_answer_proposes_escalation(sender: RecordingSender) -> None:
    low = ChatAnswer(
        kind="ESCALATE",
        intent_id="OUT_OF_CATALOG",
        message="Nie potrafię odpowiedzieć.",
        escalation_reason="Niska pewność rozpoznania pytania.",
    )
    with make_client([low], sender) as client:
        body = client.post("/chat", json={"message": "hmm"}, headers=login(client)).json()
    assert body["escalation"]["reason"] == "Niska pewność rozpoznania pytania."


def test_ta30_difficult_situation_offers_human_contact(sender: RecordingSender) -> None:
    answer = card_answer("F.06_martwe_urodzenie_smierc_dziecka", persona(7), difficult=True)
    with make_client([answer], sender) as client:
        body = client.post(
            "/chat", json={"message": "Co mi przysługuje?"}, headers=login(client, "persona-t07")
        ).json()
    assert body["escalation"]["reason"] == DIFFICULT_REASON


def test_rules_dispute_and_defaults() -> None:
    ok = card_answer("B.01_wysokosc_macierzynskiego", persona(1))
    assert escalation_reason(ok, "Ile dostanę?", previous_need_info=False) is None
    assert escalation_reason(ok, "Chcę się odwołać od decyzji", previous_need_info=False) == (
        DISPUTE_REASON
    )
    bare = ChatAnswer(kind="ESCALATE", intent_id="OUT_OF_CATALOG", message="m")
    assert escalation_reason(bare, "x", previous_need_info=False) is not None


# --- wysyłka przez zus-pue ---------------------------------------------------------------------


def _package(channel: Channel) -> EscalationPackage:
    return EscalationPackage(
        question="Pytanie",
        summary="Streszczenie",
        summary_generated_by=GeneratedBy.RULES,
        profile=None,
        engine_results=[],
        missing_or_conflicting=["child.birthDate: Kiedy urodziło się dziecko?"],
        documents=[],
        reason="Prośba użytkownika.",
        channel=channel,
    )


async def test_mcp_sender_uses_send_question_or_book_contact() -> None:
    tools = FakeToolClient(
        {
            ("zus-pue", "send_question"): {"caseId": "SPR-SIM-000007"},
            ("zus-pue", "book_contact"): {"bookingId": "WIZ-SIM-000003"},
        }
    )
    sender = McpEscalationSender(tools)
    principal = Principal("persona-t01", "s-1")
    assert await sender.send(principal, _package(Channel.PUE_MESSAGE)) == "SPR-SIM-000007"
    assert await sender.send(principal, _package(Channel.EVISIT)) == "WIZ-SIM-000003"
    message = tools.calls[0].arguments["message"]
    assert "Pytanie: Pytanie" in message
    assert "Brakujące dane" in message
    assert tools.calls[1].arguments == {"user_ref": "persona-t01", "channel": "EVISIT"}


def test_message_text_lists_engine_results() -> None:
    result = EngineResult(
        intent_id="B.01_wysokosc_macierzynskiego",
        verdict=Verdict.YES,
        summary="s",
        engine_version="params-2025-03-19",
    )
    package = _package(Channel.PUE_MESSAGE).model_copy(update={"engine_results": [result]})
    assert "B.01_wysokosc_macierzynskiego – YES" in message_text(package)


def test_builders_from_environment(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("LLM_PROVIDER", "fake")
    monkeypatch.setenv("MCP_TOKEN_SECRET", "test-secret-0123456789")
    assert build_llm() is not None
    assert build_escalation_sender() is not None
    monkeypatch.setenv("LLM_PROVIDER", "nieznany")
    monkeypatch.setenv("MCP_TOKEN_SECRET", "krotki")
    assert build_llm() is None
    assert build_escalation_sender() is None


# --- repozytorium: w pamięci i SQL -------------------------------------------------------------


@pytest.fixture(params=["memory", pytest.param("sql", marks=pytest.mark.integration)])
async def repository(
    request: pytest.FixtureRequest,
) -> AsyncIterator[tuple[EscalationRepository, uuid.UUID]]:
    if request.param == "memory":
        yield InMemoryEscalationRepository(), uuid.uuid4()
        return
    from api.db.session_repository import SqlSessionRepository
    from api.services.sessions import hash_token, new_token

    url: str = request.getfixturevalue("pg_url")
    migrate.upgrade(url)
    engine = create_engine(url)
    session = await SqlSessionRepository(create_sessionmaker(engine)).create(
        token_hash=hash_token(new_token()),
        user_ref="u",
        auth_mode=AuthMode.MOBYWATEL,
        profile=None,
        created_at=NOW,
        expires_at=NOW,
    )
    yield SqlEscalationRepository(create_sessionmaker(engine)), session.id
    await engine.dispose()


async def test_repository_lifecycle(
    repository: tuple[EscalationRepository, uuid.UUID],
) -> None:
    repo, session_id = repository
    record = await repo.create(
        session_id=session_id,
        channel=EscalationChannel.EVISIT,
        summary="s",
        package={"a": 1},
        created_at=NOW,
    )
    assert record.status is EscalationStatus.DRAFT
    assert await repo.claim(record.id, NOW) is True
    assert await repo.claim(record.id, NOW) is False
    await repo.release(record.id)
    released = await repo.get(record.id)
    assert released is not None
    assert released.status is EscalationStatus.DRAFT
    assert await repo.claim(record.id, NOW) is True
    await repo.mark_sent(record.id, "WIZ-SIM-000001")
    sent = await repo.get(record.id)
    assert sent is not None
    assert (sent.status, sent.external_case_id) == (EscalationStatus.SENT, "WIZ-SIM-000001")
    assert await repo.claim(uuid.uuid4(), NOW) is False
    assert await repo.get(uuid.uuid4()) is None


def test_invalid_card_in_history_is_skipped(sender: RecordingSender) -> None:
    from api.db.models import MessageRole

    with make_client([], sender) as client:
        headers = login(client)
        conversations: InMemoryConversationRepository = client.app.state.conversations  # type: ignore[attr-defined]
        session = next(iter(client.app.state.sessions._by_hash.values()))  # type: ignore[attr-defined]
        asyncio.run(
            conversations.append_message(
                session.id,
                role=MessageRole.ASSISTANT,
                level=2,
                content="stara karta",
                created_at=NOW,
                card={"uszkodzona": True},
            )
        )
        body = client.post("/escalations/draft", json={"question": "P"}, headers=headers).json()
    assert body["package"]["engineResults"] == []


def test_message_text_without_missing_data() -> None:
    package = _package(Channel.PUE_MESSAGE).model_copy(update={"missing_or_conflicting": []})
    assert "Brakujące dane" not in message_text(package)
