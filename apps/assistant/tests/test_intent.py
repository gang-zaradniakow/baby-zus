"""ZUS-51: rozpoznanie intencji z wolnego tekstu (TL-07…TL-11, zestaw walidacyjny live)."""

import json
from datetime import date
from typing import Any

import pytest

from assistant.intent import (
    Classification,
    ExtractedFacts,
    catalog_prompt,
    classify,
)
from assistant.llm import FakeLLMClient, LLMUnavailableError, Message, create_llm_client
from contracts import OUT_OF_CATALOG, FactSource
from rules_engine.catalog import INTENTS


def reply(**fields: Any) -> str:
    return json.dumps({"confidence": 0.9, **fields})


async def test_tl07_question_mapped_to_catalog_intent() -> None:
    llm = FakeLLMClient([reply(intent_id="B.01_wysokosc_macierzynskiego")])
    result = await classify(llm, "Ile będę dostawać na macierzyńskim?")
    assert result.intent_id == "B.01_wysokosc_macierzynskiego"
    assert result.in_catalog
    assert result.escalate is False
    assert result.suggestions == ()


@pytest.mark.parametrize("intent_id", ["X.99_wymyslona", "B.01", "", OUT_OF_CATALOG])
async def test_tl08_unknown_id_is_out_of_catalog(intent_id: str) -> None:
    llm = FakeLLMClient([reply(intent_id=intent_id)])
    result = await classify(llm, "Jaki wózek dziecięcy polecacie?")
    assert result.intent_id == OUT_OF_CATALOG
    assert not result.in_catalog
    assert result.escalate is False  # wysoka pewność: dalej RAG (ZUS-55), nie urzędnik


async def test_tl09_low_confidence_proposes_escalation() -> None:
    llm = FakeLLMClient([reply(intent_id="C.01_wymiar_macierzynskiego", confidence=0.3)])
    result = await classify(llm, "a jak to jest z tym urlopem po porodzie")
    assert result.escalate is True
    assert result.reason == "Niska pewność rozpoznania pytania."
    assert result.suggestions  # lista podobnych pytań z wyszukiwarki katalogu


async def test_threshold_is_configurable() -> None:
    llm = FakeLLMClient([reply(intent_id="C.01_wymiar_macierzynskiego", confidence=0.7)])
    assert (await classify(llm, "urlop", threshold=0.8)).escalate is True


@pytest.mark.parametrize(
    ("question", "count"),
    [
        ("Mam bliźnięta, ile urlopu?", 2),
        ("Urodziłam trojaczki!!! ile urlopu?", 3),
        ("Urodziło się 2 dzieci naraz", 2),
    ],
)
async def test_tl10_children_count_from_text_with_user_source(question: str, count: int) -> None:
    llm = FakeLLMClient([reply(intent_id="C.01_wymiar_macierzynskiego", children_count=count)])
    result = await classify(llm, question)
    assert result.extracted.children_count == count
    assert result.extracted.source is FactSource.USER
    assert result.extracted.to_patch() == {"child": {"childrenCount": count}}


async def test_tl10_invented_facts_are_dropped() -> None:
    llm = FakeLLMClient(
        [
            reply(
                intent_id="C.01_wymiar_macierzynskiego",
                children_count=2,
                birth_date="2026-11-12",
                expected_birth_date="2027-03-01",
            )
        ]
    )
    result = await classify(llm, "Ile trwa urlop macierzyński?")
    assert result.extracted == ExtractedFacts()
    assert result.extracted.to_patch() == {}


async def test_dates_mentioned_in_question_are_kept() -> None:
    llm = FakeLLMClient(
        [
            reply(
                intent_id="C.01_wymiar_macierzynskiego",
                birth_date="2026-11-02",
                expected_birth_date="2027-03-01",
            )
        ]
    )
    question = "Urodziłam 2.11.2026 (termin był na 01.03.2027) – ile urlopu?"
    result = await classify(llm, question)
    assert result.extracted.birth_date == date(2026, 11, 2)
    assert result.extracted.expected_birth_date == date(2027, 3, 1)
    assert result.extracted.to_patch() == {
        "child": {"expectedBirthDate": "2027-03-01", "birthDate": "2026-11-02"}
    }


async def test_tl11_prompt_has_only_catalog_and_question() -> None:
    llm = FakeLLMClient([reply(intent_id="A.01_prawo_do_macierzynskiego")])
    await classify(llm, "Czy na zleceniu dostanę macierzyński?")
    [messages] = llm.requests
    assert [m.role for m in messages] == ["system", "user"]
    assert messages[1] == Message("user", "Czy na zleceniu dostanę macierzyński?")
    system = messages[0].content
    for intent in INTENTS:
        assert intent.id in system
    # żadnych danych profilu ani person
    for forbidden in ("persona-", "profileId", "salaries", "PESEL", "6040", "insurance"):
        assert forbidden not in system
    assert system == catalog_prompt()


async def test_llm_unavailable_falls_back_to_escalation_with_suggestions() -> None:
    llm = FakeLLMClient([LLMUnavailableError("timeout", 3)])
    result = await classify(llm, "Ile wyniesie mój zasiłek macierzyński?")
    assert result == Classification(
        OUT_OF_CATALOG,
        0.0,
        escalate=True,
        reason="Nie udało się rozpoznać pytania (model niedostępny).",
        suggestions=result.suggestions,
    )
    assert "B.01_wysokosc_macierzynskiego" in result.suggestions


async def test_invalid_model_output_is_handled() -> None:
    llm = FakeLLMClient(["nie wiem", "dalej nie wiem"])
    result = await classify(llm, "urlop ojcowski")
    assert result.intent_id == OUT_OF_CATALOG
    assert result.escalate is True


# --- zestaw walidacyjny na żywym modelu (ADR 0002: K2 ≥ 17/20 i 4/4 spoza katalogu) ---

VALIDATION_SET: list[tuple[str, str]] = [
    (
        "ile będę dostawać na macierzyńskim jak zarabiam 7 tys brutto?",
        "B.01_wysokosc_macierzynskiego",
    ),
    (
        "Urodziłam bliźniaki, ile tygodni macierzyńskiego mi się należy?",
        "C.01_wymiar_macierzynskiego",
    ),
    ("czy na zleceniu dostanę macierzyński?", "A.01_prawo_do_macierzynskiego"),
    ("Jestem w ciąży i lekarz dał mi L4, ile płacą?", "B.02_wysokosc_chorobowego_w_ciazy"),
    ("mąż chce wziąć część rodzicielskiego, jak to rozdzielić?", "D.02_podzial_rodzicielskiego"),
    ("Do kiedy tata może wziąć ojcowskie?", "C.08_urlop_ojcowski"),
    ("Czy na rodzicielskim mogę pracować na pół etatu?", "E.01_praca_na_rodzicielskim"),
    (
        "Moje dziecko urodziło się martwe. Co mi przysługuje?",
        "F.06_martwe_urodzenie_smierc_dziecka",
    ),
    ("Gdzie mam zanieść wniosek o zasiłek, do ZUS czy do szefa?", "G.02_gdzie_zlozyc_wniosek"),
    ("ile trwa rodzicielski przy jednym dziecku", "C.02_wymiar_rodzicielskiego"),
    ("Mam trojaczki!!! ile urlopu?", "C.01_wymiar_macierzynskiego"),
    ("Jaka kwota zasiłku jak wybiorę 81,5%?", "B.01_wysokosc_macierzynskiego"),
    ("czy mogę dorabiać na rodzicielskim", "E.01_praca_na_rodzicielskim"),
    ("ile dni ma urlop ojcowski", "C.08_urlop_ojcowski"),
    ("Adoptujemy dziecko, jaki urlop nam przysługuje?", "F.04_rodzice_adopcyjni"),
    ("Kto mi wypłaci zasiłek, firma czy ZUS?", "G.05_kto_wyplaca"),
    ("Jak obliczyć wysokość mojej przyszłej emerytury?", OUT_OF_CATALOG),
    ("Jaki wózek dziecięcy polecacie?", OUT_OF_CATALOG),
    ("Czy w ciąży mogę jeść sushi?", OUT_OF_CATALOG),
    ("Kiedy dostanę zwrot podatku za ulgę na dziecko?", OUT_OF_CATALOG),
]


def test_validation_set_uses_real_catalog_ids() -> None:
    ids = {intent.id for intent in INTENTS} | {OUT_OF_CATALOG}
    assert {expected for _, expected in VALIDATION_SET} <= ids


@pytest.mark.live_llm
async def test_live_classification_accuracy() -> None:
    llm = create_llm_client()
    hits = 0
    out_of_catalog_hits = 0
    for question, expected in VALIDATION_SET:
        result = await classify(llm, question)
        hits += result.intent_id == expected
        out_of_catalog_hits += expected == OUT_OF_CATALOG and result.intent_id == OUT_OF_CATALOG
    await llm.aclose()
    assert hits >= 17, f"trafność {hits}/{len(VALIDATION_SET)}"
    assert out_of_catalog_hits == 4
