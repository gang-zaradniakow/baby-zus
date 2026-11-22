"""ZUS-52: orkiestrator poziomu 2 (TL-12…TL-19).

Szczęśliwa ścieżka idzie przez prawdziwe serwery MCP w procesie (persony, silnik reguł);
sekwencje narzędzi i błędy – przez ``FakeToolClient``.
"""

import asyncio
import json
from collections.abc import Callable
from datetime import UTC, date, datetime
from pathlib import Path
from typing import Any

import pytest

from assistant.answer import ChatAnswer
from assistant.llm import FakeEmbeddingClient, FakeLLMClient, LLMUnavailableError, Message
from assistant.orchestrator import ChatContext, Orchestrator, data_plan, with_facts
from assistant.rag import InMemoryKnowledgeIndex, KnowledgeBase, load_support_orgs
from assistant.tools import (
    FakeToolClient,
    McpToolClient,
    ToolCallError,
    create_tool_client,
)
from assistant.validation import AcceptAllValidator
from contracts import AnswerCard, FactSource, GeneratedBy, Profile, Verdict
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
SECRET = "orchestrator-test-secret"

Script = Callable[[list[Message]], str]


def llm_script(intent_id: str, summary: str = "Krótko: wynik z karty.", **extra: Any) -> Script:
    def answer(messages: list[Message]) -> str:
        if messages[0].content.startswith("Rozpoznajesz"):
            return json.dumps({"intent_id": intent_id, "confidence": 0.95, **extra})
        return json.dumps({"summary": summary})

    return answer


def orchestrator(llm: FakeLLMClient, tools: Any, **options: Any) -> Orchestrator:
    return Orchestrator(llm, tools, AcceptAllValidator(), today=lambda: TODAY, **options)


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


def persona_profile(number: int) -> Profile:
    return load_persona(next(PERSONAS.glob(f"T{number:02d}_*.json"))).profile


# --- TL-12 / TL-17 / TL-18: szczęśliwa ścieżka ---------------------------------------------


async def test_tl12_happy_path_amounts_come_from_engine(mcp_tools: McpToolClient) -> None:
    llm = FakeLLMClient(
        llm_script(
            "B.01_wysokosc_macierzynskiego",
            summary="Dostaniesz 4922,84 zł miesięcznie.",
        )
    )
    answer = await orchestrator(llm, mcp_tools).answer(
        "Ile wyniesie mój zasiłek macierzyński?", ChatContext("persona-t01", "sesja-1")
    )
    assert answer.kind == "CARD"
    assert answer.card is not None
    expected = evaluate("B.01_wysokosc_macierzynskiego", persona_profile(1), TODAY)
    assert isinstance(expected, AnswerCard)
    assert answer.card.calculation == expected.calculation
    assert answer.card.verdict is expected.verdict
    assert answer.card.generated_by is GeneratedBy.LLM_EXPLAINED
    assert answer.message == answer.card.summary == "Dostaniesz 4922,84 zł miesięcznie."
    assert answer.level1_intent_id == "B.01_wysokosc_macierzynskiego"  # TL-18
    assert answer.actions == answer.card.actions


async def test_tl17_llm_cannot_change_calculation_or_verdict(mcp_tools: McpToolClient) -> None:
    def script(messages: list[Message]) -> str:
        if messages[0].content.startswith("Rozpoznajesz"):
            return json.dumps({"intent_id": "B.01_wysokosc_macierzynskiego", "confidence": 0.9})
        return json.dumps(
            {"summary": "Tekst.", "verdict": "NO", "calculation": {"monthly": "99999.00"}}
        )

    answer = await orchestrator(FakeLLMClient(script), mcp_tools).answer(
        "Ile dostanę?", ChatContext("persona-t01")
    )
    expected = evaluate("B.01_wysokosc_macierzynskiego", persona_profile(1), TODAY)
    assert isinstance(expected, AnswerCard)
    assert answer.card is not None
    assert answer.card.model_dump(exclude={"summary", "generated_by"}) == expected.model_dump(
        exclude={"summary", "generated_by"}
    )


async def test_summary_prompt_gets_engine_card_not_profile(mcp_tools: McpToolClient) -> None:
    llm = FakeLLMClient(llm_script("B.01_wysokosc_macierzynskiego"))
    await orchestrator(llm, mcp_tools).answer("Ile dostanę?", ChatContext("persona-t01"))
    summary_prompt = llm.requests[1][1].content
    assert "4922.84" in summary_prompt
    assert "persona-t01" not in summary_prompt
    assert "salaries" not in summary_prompt


class _RejectFirst:
    def __init__(self, rejections: int) -> None:
        self.left = rejections
        self.seen: list[str] = []

    def problems(self, summary: str, card: AnswerCard) -> list[str]:
        self.seen.append(summary)
        if self.left:
            self.left -= 1
            return ["kwota spoza karty: 5000,00 zł"]
        return []


async def test_validator_rejection_triggers_retry_with_feedback(mcp_tools: McpToolClient) -> None:
    llm = FakeLLMClient(llm_script("B.01_wysokosc_macierzynskiego"))
    validator = _RejectFirst(1)
    engine = Orchestrator(llm, mcp_tools, validator, today=lambda: TODAY)
    answer = await engine.answer("Ile dostanę?", ChatContext("persona-t01"))
    assert answer.card is not None
    assert answer.card.generated_by is GeneratedBy.LLM_EXPLAINED
    assert len(validator.seen) == 2
    assert "kwota spoza karty" in llm.requests[-1][-1].content


async def test_validator_rejecting_all_attempts_leaves_engine_template(
    mcp_tools: McpToolClient,
) -> None:
    llm = FakeLLMClient(llm_script("B.01_wysokosc_macierzynskiego"))
    engine = Orchestrator(llm, mcp_tools, _RejectFirst(99), today=lambda: TODAY)
    answer = await engine.answer("Ile dostanę?", ChatContext("persona-t01"))
    assert answer.card is not None
    assert answer.card.generated_by is GeneratedBy.RULES
    assert len(llm.requests) == 1 + 3  # klasyfikacja + 3 próby podsumowania


async def test_tl16_llm_unavailable_for_summary_gives_rules_card(
    mcp_tools: McpToolClient,
) -> None:
    replies: list[str | LLMUnavailableError] = [
        json.dumps({"intent_id": "C.01_wymiar_macierzynskiego", "confidence": 0.9}),
        LLMUnavailableError("timeout", 3),
    ]
    answer = await orchestrator(FakeLLMClient(replies), mcp_tools).answer(
        "Ile tygodni urlopu?", ChatContext("persona-t01")
    )
    assert answer.kind == "CARD"
    assert answer.card is not None
    assert answer.card.generated_by is GeneratedBy.RULES
    expected = evaluate("C.01_wymiar_macierzynskiego", persona_profile(1), TODAY)
    assert isinstance(expected, AnswerCard)
    assert answer.card == expected


async def test_need_info_card_is_not_paraphrased(mcp_tools: McpToolClient) -> None:
    profile = Profile.model_validate(
        {
            "profileId": "anon-1",
            "applicant": {"role": "MOTHER", "insurance": {"source": "USER"}},
            "child": {"source": "USER"},
        }
    )
    llm = FakeLLMClient(llm_script("A.01_prawo_do_macierzynskiego"))
    answer = await orchestrator(llm, mcp_tools).answer(
        "Czy dostanę macierzyński?", ChatContext("anon-1", profile=profile, zus_data=False)
    )
    assert answer.card is not None
    assert answer.card.verdict is Verdict.NEED_INFO
    assert answer.card.generated_by is GeneratedBy.RULES
    assert len(llm.requests) == 1


async def test_facts_from_question_reach_calculator(mcp_tools: McpToolClient) -> None:
    from assistant.intent import ExtractedFacts

    llm = FakeLLMClient(llm_script("C.01_wymiar_macierzynskiego", children_count=2))
    answer = await orchestrator(llm, mcp_tools).answer(
        "Mam bliźnięta – ile urlopu macierzyńskiego?", ChatContext("persona-t01")
    )
    twins = with_facts(persona_profile(1), ExtractedFacts(children_count=2))
    expected = evaluate("C.01_wymiar_macierzynskiego", twins, TODAY)
    assert isinstance(expected, AnswerCard)
    assert answer.card is not None
    assert answer.card.facts == expected.facts
    assert answer.card.calculation == expected.calculation


# --- TL-13: sekwencja narzędzi --------------------------------------------------------------


def fake_tools() -> FakeToolClient:
    card = evaluate("C.01_wymiar_macierzynskiego", persona_profile(1), TODAY)
    assert isinstance(card, AnswerCard)
    responses: dict[tuple[str, str], Any] = {
        ("profil", "get_profile"): {
            "profile": persona_profile(1).model_dump(mode="json"),
            "stage": {"stage": "E2", "flags": []},
        },
        ("zus-ubezpieczenia", "get_insurance_periods"): {"source": "ZUS", "periods": []},
        ("zus-ubezpieczenia", "get_contribution_base"): {"source": "ZUS", "salaries": []},
        ("zus-ubezpieczenia", "get_payer_info"): {"source": "ZUS", "payer": None},
        ("zus-naleznosci", "get_debt_status"): {"contributionDebt": None},
        ("zus-ezla", "list_sick_leaves"): {"sickLeaves": []},
        ("kalkulator", "check_eligibility"): {
            "kind": "CARD",
            "card": card.model_dump(mode="json"),
        },
    }
    return FakeToolClient(responses)


@pytest.mark.parametrize(
    ("intent_id", "sequence"),
    [
        ("A.01_prawo_do_macierzynskiego", ["zus-ubezpieczenia.get_insurance_periods"]),
        (
            "B.02_wysokosc_chorobowego_w_ciazy",
            ["zus-ubezpieczenia.get_contribution_base", "zus-ezla.list_sick_leaves"],
        ),
        ("C.01_wymiar_macierzynskiego", []),
        ("G.05_kto_wyplaca", ["zus-ubezpieczenia.get_payer_info"]),
        (
            "H.04_zadluzenie",
            ["zus-ubezpieczenia.get_insurance_periods", "zus-naleznosci.get_debt_status"],
        ),
    ],
)
async def test_tl13_tool_sequence_per_category(intent_id: str, sequence: list[str]) -> None:
    tools = fake_tools()
    llm = FakeLLMClient(llm_script(intent_id))
    await orchestrator(llm, tools).answer("pytanie", ChatContext("persona-t01", "s-1"))
    assert tools.sequence == ["profil.get_profile", *sequence, "kalkulator.check_eligibility"]
    assert {p.user_ref for p in tools.principals} == {"persona-t01"}
    assert {p.session_id for p in tools.principals} == {"s-1"}
    assert data_plan(intent_id) == tuple(tuple(s.split(".")) for s in sequence)


async def test_debt_status_is_asked_for_today() -> None:
    tools = fake_tools()
    await orchestrator(FakeLLMClient(llm_script("H.04_zadluzenie")), tools).answer(
        "pytanie", ChatContext("persona-t01")
    )
    [debt] = [c for c in tools.calls if c.tool == "get_debt_status"]
    assert debt.arguments == {"user_ref": "persona-t01", "on_date": "2026-11-22"}


async def test_form_session_skips_zus_tools_and_sends_profile() -> None:
    tools = fake_tools()
    profile = persona_profile(1).model_copy(update={"profile_id": "anon-7"})
    await orchestrator(FakeLLMClient(llm_script("A.01_prawo_do_macierzynskiego")), tools).answer(
        "pytanie", ChatContext("anon-7", profile=profile, zus_data=False)
    )
    assert tools.sequence == ["kalkulator.check_eligibility"]
    assert tools.calls[0].arguments["profile"]["profileId"] == "anon-7"


async def test_patched_zus_session_uses_session_profile() -> None:
    tools = fake_tools()
    patched = persona_profile(1).model_copy(update={"leave_plan": []})
    await orchestrator(FakeLLMClient(llm_script("C.01_wymiar_macierzynskiego")), tools).answer(
        "pytanie", ChatContext("persona-t01", profile=patched, zus_data=True)
    )
    assert tools.sequence == ["profil.get_profile", "kalkulator.check_eligibility"]
    assert "profile" in tools.calls[-1].arguments


async def test_without_zus_data_and_profile_calculator_reads_source() -> None:
    tools = fake_tools()
    await orchestrator(FakeLLMClient(llm_script("C.01_wymiar_macierzynskiego")), tools).answer(
        "pytanie", ChatContext("persona-t01", zus_data=False)
    )
    assert tools.sequence == ["kalkulator.check_eligibility"]
    assert "profile" not in tools.calls[0].arguments


# --- TL-14 / TL-15: błędy narzędzi ----------------------------------------------------------


@pytest.mark.parametrize(
    ("failing", "code"),
    [
        (("profil", "get_profile"), "NOT_FOUND"),
        (("zus-ubezpieczenia", "get_insurance_periods"), "BACKEND_UNAVAILABLE"),
        (("kalkulator", "check_eligibility"), "INTERNAL"),
        (("kalkulator", "check_eligibility"), "TIMEOUT"),  # TL-15
    ],
)
async def test_tl14_tool_error_escalates_without_card(failing: tuple[str, str], code: str) -> None:
    tools = fake_tools()
    tools.responses[failing] = ToolCallError(*failing, code)
    answer = await orchestrator(
        FakeLLMClient(llm_script("A.01_prawo_do_macierzynskiego")), tools
    ).answer("pytanie", ChatContext("persona-t01"))
    assert answer.kind == "ESCALATE"
    assert answer.card is None
    assert answer.escalation_reason == "Nie udało się pobrać danych potrzebnych do odpowiedzi."
    assert [a.type for a in answer.actions] == ["ESCALATE"]


async def test_low_confidence_escalates_before_any_tool() -> None:
    tools = fake_tools()
    llm = FakeLLMClient(
        [json.dumps({"intent_id": "C.01_wymiar_macierzynskiego", "confidence": 0.2})]
    )
    answer = await orchestrator(llm, tools).answer("hmm urlop", ChatContext("persona-t01"))
    assert answer.kind == "ESCALATE"
    assert answer.escalation_reason == "Niska pewność rozpoznania pytania."
    assert answer.suggestions
    assert tools.calls == []


# --- TL-19: pytania spoza katalogu i brak reguły -------------------------------------------


async def test_tl19_out_of_catalog_goes_to_knowledge_base(mcp_tools: McpToolClient) -> None:
    llm = FakeLLMClient(llm_script("OUT_OF_CATALOG"))
    answer = await orchestrator(llm, mcp_tools).answer(
        "Urodziłam martwe dziecko, jaki urlop mi przysługuje?", ChatContext("persona-t07")
    )
    assert answer.kind == "KNOWLEDGE"
    assert answer.card is None
    assert answer.sources
    assert all(str(s.url).startswith("https://") for s in answer.sources)
    assert answer.level1_intent_id is None


async def test_tl19_search_tools_are_called() -> None:
    hit = {"title": "t", "url": "https://www.zus.pl/x", "text": "fragment", "score": 0.8}
    tools = FakeToolClient(
        {
            ("wiedza", "search_law"): {"results": [hit]},
            ("wiedza", "search_guides"): {"results": []},
        }
    )
    answer = await orchestrator(FakeLLMClient(llm_script("OUT_OF_CATALOG")), tools).answer(
        "Czy ZUS dopłaci do wyprawki?", ChatContext("persona-t01")
    )
    assert tools.sequence == ["wiedza.search_law", "wiedza.search_guides"]
    assert tools.calls[0].arguments == {"query": "Czy ZUS dopłaci do wyprawki?", "limit": 3}
    assert answer.kind == "KNOWLEDGE"


async def test_no_relevant_source_escalates() -> None:
    weak = {"title": "t", "url": "https://www.zus.pl/x", "text": "fragment", "score": 0.05}
    tools = FakeToolClient(
        {
            ("wiedza", "search_law"): {"results": [weak]},
            ("wiedza", "search_guides"): {"results": []},
        }
    )
    answer = await orchestrator(FakeLLMClient(llm_script("OUT_OF_CATALOG")), tools).answer(
        "Czy ZUS dopłaci mi do wózka dziecięcego?", ChatContext("persona-t11")
    )
    assert answer.kind == "ESCALATE"
    assert answer.escalation_reason == "Brak źródła w bazie wiedzy."


async def test_knowledge_tool_error_escalates() -> None:
    tools = FakeToolClient(
        {("wiedza", "search_law"): ToolCallError("wiedza", "search_law", "INTERNAL")}
    )
    answer = await orchestrator(FakeLLMClient(llm_script("OUT_OF_CATALOG")), tools).answer(
        "Czy ZUS dopłaci do wyprawki?", ChatContext("persona-t01")
    )
    assert answer.kind == "ESCALATE"


async def test_unsupported_intent_uses_knowledge_base(mcp_tools: McpToolClient) -> None:
    llm = FakeLLMClient(llm_script("H.07_ochrona_przed_zwolnieniem"))
    answer = await orchestrator(llm, mcp_tools, min_source_score=0.0).answer(
        "Czy pracodawca może mnie zwolnić w ciąży?", ChatContext("persona-t01")
    )
    assert answer.kind == "KNOWLEDGE"
    assert answer.level1_intent_id == "H.07_ochrona_przed_zwolnieniem"


def test_with_facts_marks_child_as_user() -> None:
    from assistant.intent import ExtractedFacts

    profile = persona_profile(1)
    assert with_facts(profile, ExtractedFacts()) is profile
    enriched = with_facts(profile, ExtractedFacts(children_count=2))
    assert enriched.child.children_count == 2
    assert enriched.child.source is FactSource.USER


# --- klient MCP ------------------------------------------------------------------------------


async def test_mcp_client_maps_tool_errors(mcp_tools: McpToolClient) -> None:
    with pytest.raises(ToolCallError) as error:
        await mcp_tools.call(
            ChatContext("persona-t01").principal,
            "zus-ezla",
            "list_sick_leaves",
            {"user_ref": "persona-t02"},
        )
    assert error.value.code == "FORBIDDEN"
    with pytest.raises(ToolCallError, match="UNKNOWN_SERVER"):
        await mcp_tools.call(ChatContext("u").principal, "nie-ma", "x", {})


async def test_tl15_mcp_timeout_and_unreachable_server() -> None:
    from mcp.server.mcpserver import MCPServer

    slow = MCPServer("wolny")

    @slow.tool()
    async def wait(user_ref: str) -> dict[str, str]:
        await asyncio.sleep(5)
        return {}

    client = McpToolClient({"wolny": slow}, TokenSigner(SECRET), timeout_s=0.2)
    principal = ChatContext("u").principal
    with pytest.raises(ToolCallError) as timeout:
        await client.call(principal, "wolny", "wait", {"user_ref": "u"})
    assert timeout.value.code == "TIMEOUT"


async def test_unreachable_server_is_unavailable() -> None:
    broken = McpToolClient({"zly": "nie-ma-takiego-adresu"}, TokenSigner(SECRET), timeout_s=10)
    with pytest.raises(ToolCallError) as error:
        await broken.call(ChatContext("u").principal, "zly", "x", {})
    assert error.value.code == "UNAVAILABLE"


def test_tool_client_from_env() -> None:
    client = create_tool_client(
        {"MCP_BASE_URL": "http://mcp_servers:8000/", "MCP_TOKEN_SECRET": SECRET}
    )
    assert client._endpoints["kalkulator"] == "http://mcp_servers:8000/kalkulator/mcp"
    assert client._timeout_s == 10.0


async def test_fake_tool_client_reports_missing_configuration() -> None:
    tools = FakeToolClient({("a", "b"): lambda arguments: {"echo": arguments}})
    assert await tools.call(ChatContext("u").principal, "a", "b", {"x": 1}) == {"echo": {"x": 1}}
    with pytest.raises(ToolCallError, match="NOT_CONFIGURED"):
        await tools.call(ChatContext("u").principal, "a", "c", {})


def test_chat_answer_shape() -> None:
    answer = ChatAnswer(kind="ESCALATE", intent_id="OUT_OF_CATALOG", message="m")
    assert answer.model_dump(mode="json")["kind"] == "ESCALATE"
