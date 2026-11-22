"""Testy karty odpowiedzi (§5.1). ID testów z planu: TC-01…TC-04 + uzupełniające TC-1x."""

import json
from decimal import Decimal
from typing import Any

import pytest
from hypothesis import given
from hypothesis import strategies as st
from pydantic import ValidationError

from contracts import AnswerCard, Calculation, GeneratedBy, Period, Verdict

type JsonDict = dict[str, Any]


def _error_text(exc: pytest.ExceptionInfo[ValidationError]) -> str:
    return str(exc.value)


# --- TC-01: przykład z §5.1 --------------------------------------------------------------


def test_answer_card_accepts_spec_example(card_json: JsonDict) -> None:
    card = AnswerCard.model_validate(card_json)

    assert card.verdict is Verdict.YES
    assert card.generated_by is GeneratedBy.RULES
    assert card.calculation is not None
    assert card.calculation.total == Decimal("59332.00")
    assert card.calculation.periods[0].date_from.isoformat() == "2026-11-12"


def test_answer_card_json_roundtrip_is_lossless(card_json: JsonDict) -> None:
    card = AnswerCard.model_validate(card_json)
    assert AnswerCard.model_validate_json(card.model_dump_json()) == card


def test_answer_card_serializes_camel_case_and_money_as_strings(card_json: JsonDict) -> None:
    dumped = json.loads(AnswerCard.model_validate(card_json).model_dump_json())

    assert {"intentId", "legalBasis", "engineVersion", "generatedBy"} <= dumped.keys()
    period = dumped["calculation"]["periods"][0]
    assert {"from", "to"} <= period.keys()
    assert period["amount"] == "22820.00"
    assert dumped["calculation"]["rate"] == "0.815"


def test_answer_card_accepts_snake_case_names_in_python(card_json: JsonDict) -> None:
    card = AnswerCard.model_validate(card_json)
    rebuilt = AnswerCard(
        intent_id=card.intent_id,
        verdict=card.verdict,
        summary=card.summary,
        legal_basis=card.legal_basis,
        actions=card.actions,
        engine_version=card.engine_version,
        generated_by=card.generated_by,
    )
    assert rebuilt.intent_id == "B.01_wysokosc_macierzynskiego"


# --- TC-02: brak REMINDER (U9) -----------------------------------------------------------


def test_answer_card_rejects_reminder_action(card_json: JsonDict) -> None:
    card_json["actions"] = [{"type": "REMINDER", "label": "Ustaw przypomnienie"}]

    with pytest.raises(ValidationError) as exc:
        AnswerCard.model_validate(card_json)
    assert "actions.0.type" in _error_text(exc)


# --- TC-03: spójność werdyktu i braków ---------------------------------------------------


def test_need_info_card_is_valid(need_info_card: JsonDict) -> None:
    card = AnswerCard.model_validate(need_info_card)
    assert [m.field for m in card.missing] == ["child.childrenCount"]


@pytest.mark.parametrize(
    ("overrides", "message"),
    [
        ({"missing": []}, "niepustej listy"),
        ({"calculation": {"base": "6000.00", "rate": "0.815"}}, "nie może zawierać wyliczenia"),
        ({"verdict": "YES"}, "musi być puste"),
        ({"verdict": "NO"}, "musi być puste"),
    ],
    ids=[
        "need_info_without_missing",
        "need_info_with_calculation",
        "yes_with_missing",
        "no_with_missing",
    ],
)
def test_answer_card_verdict_missing_consistency(
    need_info_card: JsonDict, overrides: JsonDict, message: str
) -> None:
    need_info_card.update(overrides)
    with pytest.raises(ValidationError, match=message):
        AnswerCard.model_validate(need_info_card)


def test_missing_fields_must_be_unique(need_info_card: JsonDict) -> None:
    need_info_card["missing"] *= 2
    with pytest.raises(ValidationError, match="więcej niż raz"):
        AnswerCard.model_validate(need_info_card)


# --- TC-04: kwoty bez utraty precyzji ----------------------------------------------------


@given(st.decimals(min_value=0, max_value=Decimal("999999999.99"), places=2))
def test_money_roundtrip_is_exact(amount: Decimal) -> None:
    calc = Calculation(base=amount, rate=Decimal("0.815"))
    restored = Calculation.model_validate_json(calc.model_dump_json())
    assert restored.base == amount
    assert restored.base.as_tuple().exponent == -2


@pytest.mark.parametrize(
    ("raw", "expected"),
    [("4890", "4890.00"), ("4890.1", "4890.10"), (4890, "4890.00"), (4890.5, "4890.50")],
)
def test_money_is_normalized_to_cents(raw: object, expected: str) -> None:
    calc = Calculation.model_validate({"base": raw, "rate": "1"})
    assert str(calc.base) == expected


@pytest.mark.parametrize(
    "raw",
    ["4890.123", "-1.00", "NaN", "Infinity", "abc"],
    ids=["3_places", "negative", "nan", "inf", "text"],
)
def test_money_rejects_invalid_values(raw: str) -> None:
    with pytest.raises(ValidationError):
        Calculation.model_validate({"base": raw, "rate": "1"})


@pytest.mark.parametrize("rate", ["-0.1", "1.01", "0.81555"])
def test_rate_must_be_fraction_with_max_4_places(rate: str) -> None:
    with pytest.raises(ValidationError):
        Calculation.model_validate({"base": "1.00", "rate": rate})


# --- spójność wyliczenia -----------------------------------------------------------------


def test_total_must_equal_sum_of_period_amounts(card_json: JsonDict) -> None:
    card_json["calculation"]["total"] = "59332.01"
    with pytest.raises(ValidationError, match="różni się od sumy"):
        AnswerCard.model_validate(card_json)


def test_period_end_before_start_is_rejected() -> None:
    with pytest.raises(ValidationError, match="wcześniejsza"):
        Period.model_validate(
            {
                "type": "OJCOWSKI",
                "from": "2026-12-10",
                "to": "2026-12-01",
                "rate": "1",
                "amount": "0",
            }
        )


# --- podstawa prawna, akcje, identyfikatory ---------------------------------------------


@pytest.mark.parametrize(
    ("url", "ok"),
    [
        ("https://www.zus.pl/swiadczenia/zasilki", True),
        ("https://zus.pl/", True),
        ("https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU19990600636", True),
        ("https://www.gov.pl/web/rodzina", True),
        ("https://www.pip.gov.pl/", True),
        ("http://www.zus.pl/", False),
        ("https://evilzus.pl/", False),
        ("https://zus.pl.evil.com/", False),
        ("https://pl.wikipedia.org/wiki/ZUS", False),
        ("zus.pl", False),
    ],
)
def test_legal_basis_url_must_be_https_on_allowed_domain(
    card_json: JsonDict, url: str, ok: bool
) -> None:
    card_json["legalBasis"][0]["url"] = url
    if ok:
        AnswerCard.model_validate(card_json)
    else:
        with pytest.raises(ValidationError, match="https w domenie"):
            AnswerCard.model_validate(card_json)


def test_legal_basis_is_required(card_json: JsonDict) -> None:
    card_json["legalBasis"] = []
    with pytest.raises(ValidationError):
        AnswerCard.model_validate(card_json)


@pytest.mark.parametrize("count", [0, 4])
def test_actions_must_be_between_1_and_3(card_json: JsonDict, count: int) -> None:
    card_json["actions"] = [{"type": "ESCALATE", "label": "Zapytaj urzędnika"}] * count
    with pytest.raises(ValidationError):
        AnswerCard.model_validate(card_json)


@pytest.mark.parametrize(
    ("intent_id", "ok"),
    [
        ("B.01_wysokosc_macierzynskiego", True),
        ("B.01", True),
        ("OUT_OF_CATALOG", True),
        ("I.01_cos", False),
        ("B.1_x", False),
        ("b.01", False),
        ("B.01_Wielkie", False),
    ],
)
def test_intent_id_format(card_json: JsonDict, intent_id: str, ok: bool) -> None:
    card_json["intentId"] = intent_id
    if ok:
        AnswerCard.model_validate(card_json)
    else:
        with pytest.raises(ValidationError):
            AnswerCard.model_validate(card_json)


@pytest.mark.parametrize("version", ["2026-10-24", "params-2026-1-24", "params-latest"])
def test_engine_version_format(card_json: JsonDict, version: str) -> None:
    card_json["engineVersion"] = version
    with pytest.raises(ValidationError):
        AnswerCard.model_validate(card_json)


@pytest.mark.parametrize("summary", ["", "   ", "x" * 501])
def test_summary_must_be_non_empty_and_short(card_json: JsonDict, summary: str) -> None:
    card_json["summary"] = summary
    with pytest.raises(ValidationError):
        AnswerCard.model_validate(card_json)


# --- ochrona kontraktu -------------------------------------------------------------------


def test_unknown_fields_are_rejected(card_json: JsonDict) -> None:
    """LLM ani backend nie mogą „dopisać” pola, którego nie ma w kontrakcie."""
    card_json["confidence"] = 0.99
    with pytest.raises(ValidationError, match="Extra inputs are not permitted"):
        AnswerCard.model_validate(card_json)


def test_card_is_immutable(card_json: JsonDict) -> None:
    card = AnswerCard.model_validate(card_json)
    with pytest.raises(ValidationError):
        card.verdict = Verdict.NO  # type: ignore[misc]
