"""ZUS-53: walidator liczb i źródeł (TL-20…TL-28)."""

import json
from datetime import date
from decimal import Decimal
from pathlib import Path

import pytest

from assistant.llm import FakeLLMClient, Message
from assistant.numbers import Kind, extract, normalize_article
from assistant.orchestrator import ChatContext, Orchestrator
from assistant.tools import FakeToolClient
from assistant.validation import Allowed, NumberValidator, allowed_from_card, check_text
from contracts import AnswerCard, GeneratedBy
from profile_source.personas import load_persona, load_personas
from rules_engine.catalog import INTENTS
from rules_engine.evaluate import evaluate

PERSONAS = Path(__file__).resolve().parents[3] / "data" / "personas"
TODAY = date(2026, 11, 22)


def card(persona: str, intent_id: str) -> AnswerCard:
    loaded = load_persona(next(PERSONAS.glob(f"{persona}_*.json")))
    result = evaluate(intent_id, loaded.profile, loaded.today)
    assert isinstance(result, AnswerCard)
    return result


B01_T01 = card("T01", "B.01_wysokosc_macierzynskiego")  # 4 922,84 zł/mies., łącznie 59 728,76 zł
VALIDATOR = NumberValidator()


# --- TL-20: wyłuskiwanie liczb --------------------------------------------------------------


@pytest.mark.parametrize(
    ("text", "kind", "value"),
    [
        ("4 890 zł", Kind.AMOUNT, Decimal(4890)),
        ("4890,00 zł", Kind.AMOUNT, Decimal("4890.00")),
        ("4 890,00 zł", Kind.AMOUNT, Decimal("4890.00")),
        ("4 890 PLN", Kind.AMOUNT, Decimal(4890)),
        ("12.11.2026", Kind.DATE, date(2026, 11, 12)),
        ("12.11.2026 r.", Kind.DATE, date(2026, 11, 12)),
        ("2026-11-12", Kind.DATE, date(2026, 11, 12)),
        ("12 listopada 2026", Kind.DATE, date(2026, 11, 12)),
        ("20 tyg.", Kind.DAYS, Decimal(140)),
        ("20 tygodni", Kind.DAYS, Decimal(140)),
        ("21 dni", Kind.DAYS, Decimal(21)),
        ("1 dzień", Kind.DAYS, Decimal(1)),
        ("12 mies.", Kind.MONTHS, Decimal(12)),
        ("81,5%", Kind.PERCENT, Decimal("81.5")),
        ("81,5 proc.", Kind.PERCENT, Decimal("81.5")),
        ("2025-11", Kind.MONTH, "2025-11"),
        ("rok 2027", Kind.YEAR, Decimal(2027)),
        ("liczba 5000", Kind.NUMBER, Decimal(5000)),
    ],
)
def test_tl20_extraction_of_polish_formats(text: str, kind: Kind, value: object) -> None:
    [token] = extract(text)
    assert token.kind is kind
    assert token.value == value


def test_tl20_article_numbers_are_not_amounts_or_periods() -> None:
    tokens = extract("Zgodnie z art. 31 ustawy i art. 182¹a § 1 KP oraz art. 180 § 12–13.")
    assert [(t.kind, t.value) for t in tokens] == [
        (Kind.ARTICLE, "31"),
        (Kind.ARTICLE, "182^1a"),
        (Kind.ARTICLE, "180"),
    ]


def test_impossible_date_is_kept_as_text() -> None:
    [token] = extract("31.02.2026")
    assert token.kind is Kind.DATE
    assert token.value == "31.02.2026"


def test_article_normalization() -> None:
    assert normalize_article("182¹a") == "182^1a"
    assert normalize_article("31") == "31"


# --- TL-21…TL-25: walidator -----------------------------------------------------------------


def test_tl21_text_using_card_values_is_accepted() -> None:
    summary = (
        "Dostaniesz 4 922,84 zł miesięcznie (81,5% podstawy 6 040,30 zł) przez 20 tygodni "
        "od 12.11.2026, łącznie 59 728,76 zł. Wniosek złóż do 03.12.2026 – zostało 11 dni "
        "(art. 31 ustawy zasiłkowej)."
    )
    assert VALIDATOR.problems(summary, B01_T01) == []


@pytest.mark.parametrize(
    ("summary", "problem"),
    [
        ("Dostaniesz 5000 zł miesięcznie.", "kwota spoza karty: 5000 zł"),  # TL-22
        ("Wniosek złóż do 04.12.2026.", "data spoza karty: 04.12.2026"),  # TL-23
        ("Urlop trwa 21 tygodni.", "okres spoza karty: 21 tygodni"),  # TL-24
        ("To około 4923 zł.", "kwota spoza karty: 4923 zł"),  # zaokrąglenie
        ("Łącznie 70 000 zł.", "kwota spoza karty: 70 000 zł"),
        ("Okres zasiłkowy 270 dni.", "okres spoza karty: 270 dni"),
        ("Do 31.02.2027.", "data spoza karty: 31.02.2027"),
        ("Za 2028-01 dostaniesz wypłatę.", "miesiąc spoza karty: 2028-01"),
        ("Wypłata 4 razy, w sumie 12345.", "liczba spoza karty: 12345"),
    ],
)
def test_tl22_24_foreign_values_are_rejected(summary: str, problem: str) -> None:
    assert VALIDATOR.problems(summary, B01_T01) == [problem]


@pytest.mark.parametrize(
    "summary",
    [
        "4922,84 zł",
        "4 922,84 zł",
        "4 922,84 zł",
        "4922.84 PLN",
        "przez 140 dni",
        "przez 20 tyg.",
        "do 3 grudnia 2026",
        "od 2026-11-12",
        "w 2 częściach dla 1 dziecka",
    ],
)
def test_tl25_equivalent_formats_are_accepted(summary: str) -> None:
    assert VALIDATOR.problems(summary, B01_T01) == []


def test_tl27_article_outside_engine_registry_is_rejected() -> None:
    assert VALIDATOR.problems("Wynika to z art. 999 ustawy.", B01_T01) == [
        "przepis spoza podstawy: art. 999"
    ]
    # artykuł z rejestru silnika (inna intencja) jest dozwolony
    assert VALIDATOR.problems("Zob. też art. 177 Kodeksu pracy.", B01_T01) == []


def test_tl27_rag_source_articles_extend_the_whitelist() -> None:
    assert NumberValidator(extra_articles=["999"]).problems("art. 999", B01_T01) == []


def test_tl28_percent_outside_card_is_rejected() -> None:
    assert VALIDATOR.problems("Dostaniesz 85% podstawy.", B01_T01) == ["procent spoza karty: 85%"]


def test_derived_durations_are_rejected() -> None:
    """Model nie liczy sam: „2 miesiące × kwota” to dwie wartości spoza karty."""
    assert VALIDATOR.problems("Za 2 miesiące – 9 845 zł.", B01_T01) == [
        "kwota spoza karty: 9 845 zł",
        "okres spoza karty: 2 miesiące",
    ]


def test_problems_are_not_repeated() -> None:
    assert VALIDATOR.problems("5000 zł, a potem znowu 5000 zł", B01_T01) == [
        "kwota spoza karty: 5000 zł"
    ]


def test_no_false_alarms_on_engine_texts() -> None:
    """Tekst napisany przez silnik zawsze przechodzi walidację własnej karty."""
    checked = 0
    for persona in load_personas(PERSONAS):
        for intent in INTENTS:
            result = evaluate(intent.id, persona.profile, persona.today)
            if not isinstance(result, AnswerCard):
                continue
            text = " ".join([result.summary, *(f.value for f in result.facts), *result.warnings])
            assert VALIDATOR.problems(text, result) == [], (persona.id, intent.id)
            checked += 1
    assert checked > 500


def test_period_boundaries_and_lengths_are_allowed() -> None:
    t09 = card("T09", "E.03_wplyw_pracy_na_kwote")
    allowed = allowed_from_card(t09)
    assert date(2027, 4, 1) in allowed.dates
    assert date(2027, 11, 11) in allowed.dates  # dzień po końcu okresu
    assert Decimal(224) in allowed.days
    assert Decimal(35) in allowed.percents
    assert check_text("od 01.04.2027 do 10.11.2027 (224 dni), 35%", allowed) == []


def test_need_info_card_texts_are_allowed() -> None:
    missing_card = evaluate(
        "A.01_prawo_do_macierzynskiego",
        load_persona(next(PERSONAS.glob("T01_*.json"))).profile.model_copy(
            update={
                "child": load_persona(next(PERSONAS.glob("T01_*.json"))).profile.child.model_copy(
                    update={"birth_date": None}
                )
            }
        ),
        TODAY,
    )
    assert isinstance(missing_card, AnswerCard)
    assert VALIDATOR.problems(missing_card.summary, missing_card) == []


def test_card_without_rates_and_period_amounts() -> None:
    assert B01_T01.calculation is not None
    bare_periods = [
        period.model_copy(update={"rate": None, "amount": None, "monthly": None})
        for period in B01_T01.calculation.periods
    ]
    calculation = B01_T01.calculation.model_copy(
        update={"rate": None, "monthly": None, "periods": bare_periods}
    )
    bare = B01_T01.model_copy(update={"calculation": calculation, "facts": [], "summary": "x"})
    allowed = allowed_from_card(bare)
    assert Decimal("6040.30") in allowed.amounts
    assert VALIDATOR.problems("4 922,84 zł", bare) == ["kwota spoza karty: 4 922,84 zł"]


def test_allowed_ignores_invalid_dates_in_card_texts() -> None:
    allowed = Allowed()
    allowed.add_text("31.02.2026")
    assert allowed.dates == set()


# --- TL-26: trzy złe odpowiedzi → szablon silnika ------------------------------------------


async def test_tl26_three_bad_summaries_fall_back_to_rules_template() -> None:
    def script(messages: list[Message]) -> str:
        if messages[0].content.startswith("Rozpoznajesz"):
            return json.dumps({"intent_id": "B.01_wysokosc_macierzynskiego", "confidence": 0.9})
        return json.dumps({"summary": "Dostaniesz 5000 zł miesięcznie."})

    tools = FakeToolClient(
        {
            ("profil", "get_profile"): {"profile": {}, "stage": {}},
            ("zus-ubezpieczenia", "get_contribution_base"): {},
            ("kalkulator", "check_eligibility"): {
                "kind": "CARD",
                "card": B01_T01.model_dump(mode="json"),
            },
        }
    )
    llm = FakeLLMClient(script)
    engine = Orchestrator(llm, tools, VALIDATOR, today=lambda: TODAY)
    answer = await engine.answer(
        "Ile dostanę?",
        ChatContext("persona-t01", profile=load_persona(next(PERSONAS.glob("T01_*.json"))).profile),
    )
    assert answer.card is not None
    assert answer.card.generated_by is GeneratedBy.RULES
    assert answer.card.summary == B01_T01.summary
    assert len(llm.requests) == 1 + 3
    assert "kwota spoza karty: 5000 zł" in llm.requests[-1][-1].content
