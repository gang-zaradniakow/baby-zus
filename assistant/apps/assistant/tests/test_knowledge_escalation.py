"""ZUS-55: odpowiedzi z bazy wiedzy tylko ze źródłem (T11), paczka eskalacyjna (TL-37…TL-41)."""

import json
from datetime import UTC, date, datetime
from pathlib import Path
from typing import Any

import pytest

from assistant.answer import Source
from assistant.escalation import (
    AttachedDocument,
    Channel,
    ConversationTurn,
    EscalationPackage,
    draft_package,
)
from assistant.knowledge import NO_ANSWER_REASON, TEMPLATE, answer_from_sources, legal_basis
from assistant.llm import FakeEmbeddingClient, FakeLLMClient, LLMUnavailableError, Message
from assistant.orchestrator import ChatContext, Orchestrator
from assistant.rag import InMemoryKnowledgeIndex, KnowledgeBase, load_support_orgs
from assistant.tools import McpToolClient
from assistant.validation import NumberValidator
from contracts import AnswerCard, GeneratedBy, Profile, Stage, StageInfo
from contracts.access_token import TokenSigner
from mcp_servers.common.audit import InMemoryAuditSink
from mcp_servers.common.runtime import ServerDeps
from mcp_servers.main import build_servers
from profile_source import MockProfileSource
from profile_source.personas import load_persona
from rules_engine.evaluate import evaluate

ROOT = Path(__file__).resolve().parents[3]
PERSONAS = ROOT / "data" / "personas"
KNOWLEDGE = ROOT / "data" / "knowledge"
TODAY = date(2026, 11, 22)
NOW = datetime(2026, 11, 22, 9, tzinfo=UTC)
SECRET = "knowledge-test-secret"

PATERNITY = Source.model_validate(
    {
        "title": "Urlop ojcowski",
        "url": "https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU19740240141",
        "excerpt": "Pracownik-ojciec ma prawo do urlopu ojcowskiego w wymiarze 2 tygodni, "
        "do ukończenia przez dziecko 12 miesięcy życia.",
        "act": "Kodeks pracy",
        "article": "art. 182³",
    }
)
GUIDE = Source.model_validate(
    {
        "title": "Wysokość zasiłku",
        "url": "https://www.zus.pl/en/swiadczenia/zasilki/zasilek-macierzynski/wysokosc",
        "excerpt": "Za okres urlopu rodzicielskiego zasiłek wynosi 70% podstawy.",
    }
)


def knowledge_reply(**fields: Any) -> str:
    return json.dumps({"answerable": True, "answer": "", "sources": [1], **fields})


def persona(number: int) -> Profile:
    return load_persona(next(PERSONAS.glob(f"T{number:02d}_*.json"))).profile


@pytest.fixture
async def mcp_tools() -> McpToolClient:
    knowledge = KnowledgeBase(FakeEmbeddingClient(), InMemoryKnowledgeIndex(), "fake")
    await knowledge.ingest_directory(KNOWLEDGE)
    deps = ServerDeps(
        MockProfileSource.from_personas(PERSONAS),
        TokenSigner(SECRET),
        InMemoryAuditSink(),
        lambda: NOW,
        knowledge=knowledge,
        support_orgs=load_support_orgs(KNOWLEDGE),
    )
    return McpToolClient(build_servers(deps), TokenSigner(SECRET), clock=lambda: NOW)


def engine(llm: FakeLLMClient, tools: Any) -> Orchestrator:
    return Orchestrator(llm, tools, NumberValidator(), today=lambda: TODAY)


# --- TL-37 / TL-38: odpowiedź tylko ze źródłem ------------------------------------------------


async def test_tl37_rag_answer_with_url_and_legal_basis(mcp_tools: McpToolClient) -> None:
    def script(messages: list[Message]) -> str:
        if messages[0].content.startswith("Rozpoznajesz"):
            return json.dumps({"intent_id": "OUT_OF_CATALOG", "confidence": 0.9})
        fragments = messages[1].content
        number = next(n for n in range(1, 7) if f"[{n}] Urlop ojcowski" in fragments)
        return knowledge_reply(
            answer="Urlop ojcowski trwa 2 tygodnie i trzeba go wykorzystać, zanim dziecko "
            "skończy 12 miesięcy.",
            sources=[number],
        )

    answer = await engine(FakeLLMClient(script), mcp_tools).answer(
        "Do kiedy tata musi wykorzystać urlop ojcowski?", ChatContext("persona-t01")
    )
    assert answer.kind == "KNOWLEDGE"
    assert answer.generated_by is GeneratedBy.LLM_EXPLAINED
    assert [s.title for s in answer.sources] == ["Urlop ojcowski"]
    assert str(answer.sources[0].url).startswith("https://isap.sejm.gov.pl/")
    assert [(ref.act, ref.article) for ref in answer.legal_basis] == [("Kodeks pracy", "art. 182³")]


async def test_tl38_t11_question_without_answer_in_sources_escalates(
    mcp_tools: McpToolClient,
) -> None:
    t11 = load_persona(next(PERSONAS.glob("T11_*.json")))
    assert t11.level2 is not None

    def script(messages: list[Message]) -> str:
        if messages[0].content.startswith("Rozpoznajesz"):
            return json.dumps({"intent_id": "OUT_OF_CATALOG", "confidence": 0.9})
        return json.dumps({"answerable": False, "answer": "", "sources": []})

    answer = await engine(FakeLLMClient(script), mcp_tools).answer(
        t11.level2.question, ChatContext("persona-t11")
    )
    assert answer.kind == "ESCALATE"  # T11: brak zmyślonej odpowiedzi
    assert answer.escalation_reason in {NO_ANSWER_REASON, "Brak źródła w bazie wiedzy."}
    assert answer.sources == []
    assert answer.card is None
    assert [a.type for a in answer.actions] == ["ESCALATE"]


@pytest.mark.parametrize(
    "reply",
    [
        json.dumps({"answerable": False, "answer": "Może tak.", "sources": [1]}),
        knowledge_reply(answer="Tak.", sources=[]),
        knowledge_reply(answer="Tak.", sources=[7]),
        knowledge_reply(answer="   ", sources=[1]),
    ],
)
async def test_tl38_ungrounded_answers_are_not_used(reply: str) -> None:
    result = await answer_from_sources(FakeLLMClient([reply]), "pytanie", [PATERNITY])
    assert result.answerable is False
    assert result.message == NO_ANSWER_REASON


async def test_numbers_outside_sources_fall_back_to_template_after_retries() -> None:
    bad = knowledge_reply(answer="Urlop ojcowski trwa 3 tygodnie i 21 dni.")
    llm = FakeLLMClient([bad, bad, bad])
    result = await answer_from_sources(llm, "urlop ojcowski", [PATERNITY, GUIDE])
    assert result.answerable is True
    assert result.llm_written is False
    assert result.message == TEMPLATE
    assert result.sources == [PATERNITY, GUIDE]
    assert len(llm.requests) == 3
    assert "spoza fragmentów" in llm.requests[-1][-1].content


async def test_retry_after_foreign_article_then_accept() -> None:
    llm = FakeLLMClient(
        [
            knowledge_reply(answer="Wynika to z art. 999."),
            knowledge_reply(answer="Wynika to z art. 182³ – 2 tygodnie."),
        ]
    )
    result = await answer_from_sources(llm, "urlop ojcowski", [PATERNITY])
    assert result.llm_written is True
    assert result.message == "Wynika to z art. 182³ – 2 tygodnie."


async def test_llm_unavailable_gives_template_with_sources() -> None:
    result = await answer_from_sources(
        FakeLLMClient([LLMUnavailableError("timeout", 3)]), "pytanie", [GUIDE]
    )
    assert (result.answerable, result.llm_written, result.message) == (True, False, TEMPLATE)


def test_legal_basis_only_from_law_sources_on_allowed_domains() -> None:
    foreign = PATERNITY.model_copy(update={"url": "https://example.com/kp"})
    assert legal_basis([GUIDE, foreign]) == []
    assert len(legal_basis([PATERNITY, PATERNITY])) == 1


# --- TL-39 / TL-40: paczka eskalacyjna §8.2 ---------------------------------------------------


def t01_card() -> AnswerCard:
    card = evaluate("B.01_wysokosc_macierzynskiego", persona(1), TODAY)
    assert isinstance(card, AnswerCard)
    return card


def need_info_card() -> AnswerCard:
    profile = persona(1).model_copy(
        update={"child": persona(1).child.model_copy(update={"birth_date": None})}
    )
    card = evaluate("A.01_prawo_do_macierzynskiego", profile, TODAY)
    assert isinstance(card, AnswerCard)
    return card


CONVERSATION = [
    ConversationTurn(role="USER", text="Zarabiam 7000 zł. Czy dostanę 81,5%? PESEL 90010112345"),
    ConversationTurn(role="ASSISTANT", text="Wariant 81,5%: 4 922,84 zł miesięcznie."),
]


async def test_tl39_package_has_all_section_8_2_fields() -> None:
    llm = FakeLLMClient(
        [
            json.dumps(
                {
                    "summary": "Użytkowniczka pyta o wariant 81,5% przy przychodzie 7000 zł; "
                    "silnik wyliczył 4 922,84 zł miesięcznie."
                }
            )
        ]
    )
    package = await draft_package(
        llm,
        question="Czy dostanę 81,5%?",
        reason="Użytkownik poprosił o kontakt z urzędnikiem.",
        channel=Channel.PUE_MESSAGE,
        conversation=CONVERSATION,
        profile=persona(1),
        stage=StageInfo(stage=Stage.E2, flags=[]),
        cards=[t01_card(), need_info_card()],
        documents=[AttachedDocument(name="Z-3.pdf", document_type="Z3")],
    )
    assert isinstance(package, EscalationPackage)
    data = package.model_dump(mode="json")
    for field in (
        "question",
        "summary",
        "profile",
        "engineResults",
        "missingOrConflicting",
        "documents",
        "reason",
        "channel",
    ):
        assert data[field], field
    assert package.summary_generated_by is GeneratedBy.LLM_EXPLAINED
    assert package.profile is not None
    assert package.profile.stage == StageInfo(stage=Stage.E2, flags=[])
    assert package.profile.insurance_titles == ["EMPLOYMENT"]
    assert [r.intent_id for r in package.engine_results] == [
        "B.01_wysokosc_macierzynskiego",
        "A.01_prawo_do_macierzynskiego",
    ]
    assert package.missing_or_conflicting == [
        "child.expectedBirthDate: Jaka jest przewidywana data porodu?"
    ]
    # paczka nie zawiera identyfikatorów ani przychodów z profilu
    assert "persona-t01" not in package.model_dump_json()
    assert "salaries" not in data["profile"]
    # PESEL z rozmowy nie trafia do modelu
    assert all("90010112345" not in m.content for r in llm.requests for m in r)


async def test_tl40_summary_with_foreign_numbers_falls_back_to_template() -> None:
    bad = json.dumps({"summary": "Należy jej się 6500 zł miesięcznie od 01.01.2027."})
    llm = FakeLLMClient([bad, bad, bad])
    package = await draft_package(
        llm,
        question="Czy dostanę 81,5%?",
        reason="Dwa kolejne braki danych.",
        channel=Channel.EVISIT,
        conversation=CONVERSATION,
        cards=[t01_card()],
    )
    assert package.summary_generated_by is GeneratedBy.RULES
    assert package.summary.startswith("Pytanie użytkownika: Czy dostanę 81,5%?")
    assert "Powód kontaktu: Dwa kolejne braki danych" in package.summary
    assert "B.01_wysokosc_macierzynskiego – YES" in package.summary
    assert package.profile is None
    assert package.documents == []
    assert len(llm.requests) == 3
    assert "kwota spoza karty: 6500 zł" in llm.requests[-1][-1].content


async def test_package_template_lists_missing_data_when_model_down() -> None:
    package = await draft_package(
        FakeLLMClient([LLMUnavailableError("timeout", 3)]),
        question="Czy mi się należy?",
        reason="Niska pewność rozpoznania pytania.",
        channel=Channel.BRANCH_VISIT,
        conversation=[],
        cards=[need_info_card()],
    )
    assert "Brakujące dane: child.expectedBirthDate" in package.summary
    assert package.summary_generated_by is GeneratedBy.RULES


async def test_user_stated_numbers_are_allowed_in_summary() -> None:
    llm = FakeLLMClient([json.dumps({"summary": "Przychód użytkowniczki to 7000 zł."})])
    package = await draft_package(
        llm,
        question="pytanie",
        reason="Prośba użytkownika.",
        channel=Channel.PUE_MESSAGE,
        conversation=CONVERSATION,
    )
    assert package.summary_generated_by is GeneratedBy.LLM_EXPLAINED


# --- TL-41: oznaczenie autora tekstu ----------------------------------------------------------


async def test_tl41_llm_written_card_is_labelled(mcp_tools: McpToolClient) -> None:
    def script(messages: list[Message]) -> str:
        if messages[0].content.startswith("Rozpoznajesz"):
            return json.dumps({"intent_id": "C.01_wymiar_macierzynskiego", "confidence": 0.9})
        return json.dumps({"summary": "Urlop macierzyński trwa 20 tygodni."})

    answer = await engine(FakeLLMClient(script), mcp_tools).answer(
        "Ile trwa urlop macierzyński?", ChatContext("persona-t01")
    )
    assert answer.card is not None
    assert answer.card.generated_by is GeneratedBy.LLM_EXPLAINED
    assert answer.generated_by is GeneratedBy.LLM_EXPLAINED


async def test_sources_that_do_not_answer_lead_to_escalation() -> None:
    from assistant.tools import FakeToolClient

    hit = {"title": "t", "url": "https://www.zus.pl/x", "text": "fragment", "score": 0.9}
    tools = FakeToolClient(
        {
            ("wiedza", "search_law"): {"results": [hit]},
            ("wiedza", "search_guides"): {"results": []},
        }
    )
    replies = [
        json.dumps({"intent_id": "OUT_OF_CATALOG", "confidence": 0.9}),
        json.dumps({"answerable": False, "answer": "", "sources": []}),
    ]
    answer = await engine(FakeLLMClient(replies), tools).answer(
        "Czy ZUS dopłaci do wyprawki?", ChatContext("persona-t11")
    )
    assert answer.kind == "ESCALATE"
    assert answer.escalation_reason == NO_ANSWER_REASON
