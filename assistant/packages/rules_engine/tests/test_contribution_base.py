"""Podstawa wymiaru (TE-10…TE-14)."""

from datetime import date
from decimal import ROUND_HALF_UP, Decimal
from typing import Any

import pytest
from hypothesis import given
from hypothesis import strategies as st

from contracts import FactSource, InsuranceProfile
from rules_engine.calculators.contribution_base import (
    BASIS_EMPLOYEE,
    BASIS_NON_EMPLOYEE,
    ContributionBase,
    contribution_base,
    format_percent,
    format_pln,
    month_end,
    window_before,
)
from rules_engine.outcomes import NeedInfo, OutOfScope
from rules_engine.params import current_params

PARAMS = current_params()
BIRTH = date(2026, 11, 12)
WINDOW = window_before(BIRTH)  # 2025-11 … 2026-10


def insurance(
    salaries: dict[str, str] | list[str] | None = None,
    periods: list[dict[str, Any]] | None = None,
    rate: str | None = "0.1371",
    source: str = "ZUS",
) -> InsuranceProfile:
    if isinstance(salaries, list):
        salaries = dict.fromkeys(salaries, "7000.00")
    return InsuranceProfile.model_validate(
        {
            "source": source,
            "salaries": [{"month": m, "gross": g} for m, g in (salaries or {}).items()],
            "periods": periods
            if periods is not None
            else [{"title": "EMPLOYMENT", "sickness": "MANDATORY", "dateFrom": "2020-01-01"}],
            "deductionRate": rate,
        }
    )


def computed(outcome: object) -> ContributionBase:
    assert isinstance(outcome, ContributionBase), outcome
    return outcome


# --- okno 12 miesięcy --------------------------------------------------------------------


def test_window_is_12_calendar_months_before_event_month() -> None:
    assert WINDOW[0] == "2025-11"
    assert WINDOW[-1] == "2026-10"
    assert len(WINDOW) == 12
    assert window_before(date(2026, 1, 31))[-1] == "2025-12"  # przełom roku


@pytest.mark.parametrize(
    ("key", "last_day"),
    [
        ("2026-02", date(2026, 2, 28)),
        ("2028-02", date(2028, 2, 29)),
        ("2026-12", date(2026, 12, 31)),
    ],
)
def test_month_end(key: str, last_day: date) -> None:
    assert month_end(key) == last_day


# --- TE-10: pełne 12 miesięcy ------------------------------------------------------------


def test_contribution_base_full_12_months() -> None:
    result = computed(contribution_base(insurance(WINDOW), BIRTH, PARAMS))
    assert result.amount == Decimal("6040.30")  # 7000,00 − 13,71%
    assert result.months == tuple(WINDOW)
    assert result.legal_basis == BASIS_EMPLOYEE


def test_salaries_outside_window_are_ignored() -> None:
    salaries = dict.fromkeys(WINDOW, "7000.00") | {"2025-10": "99000.00", "2026-11": "99000.00"}
    result = computed(contribution_base(insurance(salaries), BIRTH, PARAMS))
    assert result.amount == Decimal("6040.30")


def test_average_of_different_amounts() -> None:
    salaries = dict.fromkeys(WINDOW, "6000.00") | {"2026-10": "12000.00"}
    result = computed(contribution_base(insurance(salaries, rate="0"), BIRTH, PARAMS))
    assert result.amount == Decimal("6500.00")  # (11 × 6000 + 12000) / 12


# --- TE-11: stopa potrąceń ze sprawy (U7) ------------------------------------------------


def test_contribution_base_uses_deduction_rate_from_case() -> None:
    result = computed(contribution_base(insurance(WINDOW, rate="0.1000"), BIRTH, PARAMS))
    assert result.amount == Decimal("6300.00")
    assert result.deduction_rate_source is FactSource.ZUS
    assert not any("domyślną stopę" in a for a in result.assumptions)


def test_missing_deduction_rate_uses_default_and_says_so() -> None:
    result = computed(contribution_base(insurance(WINDOW, rate=None), BIRTH, PARAMS))
    assert result.amount == Decimal("6040.30")
    assert result.deduction_rate == PARAMS.default_deduction_rate.value
    assert result.deduction_rate_source is None
    assert any("domyślną stopę potrąconych składek 13,71%" in a for a in result.assumptions)


# --- TE-12: krótsze ubezpieczenie --------------------------------------------------------


def test_contribution_base_shorter_than_12_months() -> None:
    periods = [{"title": "EMPLOYMENT", "sickness": "MANDATORY", "dateFrom": "2026-07-01"}]
    salaries = {
        "2026-07": "4000.00",
        "2026-08": "5000.00",
        "2026-09": "6000.00",
        "2026-10": "7000.00",
    }
    result = computed(contribution_base(insurance(salaries, periods, rate="0"), BIRTH, PARAMS))
    assert result.months == ("2026-07", "2026-08", "2026-09", "2026-10")
    assert result.amount == Decimal("5500.00")


def test_partial_first_month_of_insurance_is_excluded() -> None:
    periods = [{"title": "EMPLOYMENT", "sickness": "MANDATORY", "dateFrom": "2026-06-15"}]
    salaries = {
        "2026-06": "1000.00",
        **dict.fromkeys(["2026-07", "2026-08", "2026-09", "2026-10"], "6000.00"),
    }
    result = computed(contribution_base(insurance(salaries, periods, rate="0"), BIRTH, PARAMS))
    assert result.amount == Decimal("6000.00")
    assert result.excluded_months == ("2026-06",)
    assert any("Pominięto niepełne miesiące" in a for a in result.assumptions)


def test_adjacent_periods_count_as_continuous_insurance() -> None:
    """Zmiana pracy w połowie miesiąca bez przerwy – miesiąc nadal pełny."""
    periods = [
        {"title": "EMPLOYMENT", "sickness": "MANDATORY", "dateFrom": "2025-01-01",
         "dateTo": "2026-03-15", "endReason": "OTHER"},
        {"title": "EMPLOYMENT", "sickness": "MANDATORY", "dateFrom": "2026-03-16"},
    ]  # fmt: skip
    result = computed(contribution_base(insurance(WINDOW, periods), BIRTH, PARAMS))
    assert "2026-03" in result.months
    assert len(result.months) == 12


def test_month_of_break_between_jobs_is_excluded() -> None:
    periods = [
        {"title": "EMPLOYMENT", "sickness": "MANDATORY", "dateFrom": "2024-01-01",
         "dateTo": "2026-02-28", "endReason": "CONTRACT_EXPIRY"},
        {"title": "EMPLOYMENT", "sickness": "MANDATORY", "dateFrom": "2026-04-01"},
    ]  # fmt: skip
    salaries = dict.fromkeys(WINDOW, "7000.00")
    salaries.pop("2026-03")
    result = computed(contribution_base(insurance(salaries, periods), BIRTH, PARAMS))
    assert "2026-03" not in result.months
    assert len(result.months) == 11


def test_months_without_sickness_insurance_are_excluded() -> None:
    periods = [
        {"title": "MANDATE_CONTRACT", "sickness": "NONE",
         "dateFrom": "2025-01-01", "dateTo": "2026-04-30"},
        {"title": "MANDATE_CONTRACT", "sickness": "VOLUNTARY", "dateFrom": "2026-05-01"},
    ]  # fmt: skip
    result = computed(contribution_base(insurance(WINDOW, periods), BIRTH, PARAMS))
    assert result.months == ("2026-05", "2026-06", "2026-07", "2026-08", "2026-09", "2026-10")
    assert result.legal_basis == BASIS_NON_EMPLOYEE  # zleceniobiorca – inny przepis


def test_no_periods_given_trusts_listed_months() -> None:
    result = computed(
        contribution_base(
            insurance(["2026-09", "2026-10"], periods=[], source="USER"), BIRTH, PARAMS
        )
    )
    assert result.months == ("2026-09", "2026-10")
    assert result.salaries_source is FactSource.USER
    assert any("Okresów ubezpieczenia nie podano" in a for a in result.assumptions)


# --- TE-13: zaokrąglenia -----------------------------------------------------------------


def test_average_rounds_half_up_to_grosz() -> None:
    salaries = {"2026-09": "100.00", "2026-10": "100.01"}
    result = computed(contribution_base(insurance(salaries, periods=[], rate="0"), BIRTH, PARAMS))
    assert result.amount == Decimal("100.01")  # 100,005 → 100,01 (nie bankowe 100,00)


def test_deduction_is_rounded_per_month() -> None:
    # 1000,05 × 13,71% = 137,10686 → 137,11 zł; 1000,05 − 137,11 = 862,94
    result = computed(
        contribution_base(insurance({"2026-10": "1000.05"}, periods=[]), BIRTH, PARAMS)
    )
    assert result.amount == Decimal("862.94")


@given(
    st.lists(
        st.decimals(min_value=0, max_value=Decimal("100000"), places=2),
        min_size=1,
        max_size=12,
    ),
    st.decimals(min_value=0, max_value=Decimal("0.3"), places=4),
)
def test_contribution_base_rounding_property(amounts: list[Decimal], rate: Decimal) -> None:
    months = WINDOW[-len(amounts) :]
    salaries = {m: str(a) for m, a in zip(months, amounts, strict=True)}
    result = computed(
        contribution_base(insurance(salaries, periods=[], rate=str(rate)), BIRTH, PARAMS)
    )
    cent = Decimal("0.01")
    net = [a - (a * rate).quantize(cent, ROUND_HALF_UP) for a in amounts]
    assert result.amount == (sum(net, Decimal(0)) / len(net)).quantize(cent, ROUND_HALF_UP)
    assert result.amount.as_tuple().exponent == -2
    assert Decimal(0) <= result.amount <= max(amounts)


# --- TE-14: brak danych i przypadki poza zakresem ---------------------------------------


def test_contribution_base_no_income_needs_info() -> None:
    outcome = contribution_base(insurance(None, periods=[]), BIRTH, PARAMS)
    assert isinstance(outcome, NeedInfo)
    assert outcome.missing == ("applicant.insurance.salaries",)


def test_missing_salary_for_insured_month_needs_info() -> None:
    outcome = contribution_base(insurance(WINDOW[:-2]), BIRTH, PARAMS)
    assert isinstance(outcome, NeedInfo)
    assert "2026-09, 2026-10" in outcome.reason


def test_no_full_month_of_insurance_is_out_of_scope() -> None:
    periods = [{"title": "EMPLOYMENT", "sickness": "MANDATORY", "dateFrom": "2026-10-20"}]
    outcome = contribution_base(insurance({"2026-10": "3000.00"}, periods), BIRTH, PARAMS)
    assert isinstance(outcome, OutOfScope)
    assert outcome.legal_basis


def test_insurance_ended_before_window_needs_info() -> None:
    periods = [{"title": "EMPLOYMENT", "sickness": "MANDATORY", "dateFrom": "2020-01-01",
                "dateTo": "2024-12-31", "endReason": "OTHER"}]  # fmt: skip
    outcome = contribution_base(insurance(WINDOW, periods), BIRTH, PARAMS)
    assert isinstance(outcome, NeedInfo)


def test_need_info_requires_missing_field() -> None:
    with pytest.raises(ValueError, match="co najmniej jednego"):
        NeedInfo((), "brak")


# --- fakty i formatowanie ---------------------------------------------------------------


def test_facts_for_answer_card() -> None:
    facts = computed(contribution_base(insurance(WINDOW), BIRTH, PARAMS)).facts()
    assert facts[0].label == "Podstawa wymiaru"
    assert facts[0].value == "6 040,30 zł (średnia z 12 mies.: 2025-11 – 2026-10)"
    assert facts[0].source is FactSource.ZUS
    assert facts[1].value == "13,71%"


def test_facts_without_case_rate_have_no_deduction_fact() -> None:
    facts = computed(contribution_base(insurance(WINDOW, rate=None), BIRTH, PARAMS)).facts()
    assert [f.label for f in facts] == ["Podstawa wymiaru"]


@pytest.mark.parametrize(
    ("value", "text"),
    [("0", "0,00 zł"), ("4890.5", "4 890,50 zł"), ("1234567.891", "1 234 567,89 zł")],
)
def test_format_pln(value: str, text: str) -> None:
    assert format_pln(Decimal(value)) == text


@pytest.mark.parametrize(
    ("rate", "text"), [("0.1371", "13,71%"), ("0.815", "81,5%"), ("1", "100%")]
)
def test_format_percent(rate: str, text: str) -> None:
    assert format_percent(Decimal(rate)) == text
