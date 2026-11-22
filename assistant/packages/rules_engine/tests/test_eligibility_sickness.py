"""Zasiłek chorobowy w ciąży i okres wyczekiwania (TE-15, TE-23)."""

from datetime import date, timedelta

import pytest

from contracts import Verdict
from rules_engine.eligibility import check_sickness_in_pregnancy
from rules_engine.params import current_params
from rules_engine.testing import make_profile, period

PARAMS = current_params()
SICK_DAY = date(2026, 11, 2)
TODAY = date(2026, 11, 21)


def leave(day: date = SICK_DAY, code: str | None = "B") -> list[dict[str, str]]:
    data = {"dateFrom": day.isoformat(), "dateTo": (day + timedelta(days=13)).isoformat()}
    return [data | ({"code": code} if code else {})]


def insured_from(
    days_before: int, sickness: str = "MANDATORY", title: str = "EMPLOYMENT"
) -> list[dict[str, str]]:
    return [period(title, sickness, (SICK_DAY - timedelta(days=days_before)).isoformat())]


# --- TE-15: okres wyczekiwania 30 / 90 dni -----------------------------------------------


@pytest.mark.parametrize(
    ("sickness", "title", "days", "verdict"),
    [
        ("MANDATORY", "EMPLOYMENT", 29, Verdict.NO),
        ("MANDATORY", "EMPLOYMENT", 30, Verdict.YES),
        ("VOLUNTARY", "MANDATE_CONTRACT", 89, Verdict.NO),
        ("VOLUNTARY", "MANDATE_CONTRACT", 90, Verdict.YES),
    ],
)
def test_sickness_waiting_period(sickness: str, title: str, days: int, verdict: Verdict) -> None:
    profile = make_profile(insured_from(days, sickness, title), sick_leaves=leave())
    decision = check_sickness_in_pregnancy(profile, TODAY, PARAMS)
    assert decision.verdict is verdict
    assert f"{days} dni" in decision.facts[-1].value


def test_no_verdict_says_when_right_starts_and_mentions_exceptions() -> None:
    profile = make_profile(insured_from(20), sick_leaves=leave())
    decision = check_sickness_in_pregnancy(profile, TODAY, PARAMS)
    assert "od 12.11.2026" in decision.summary  # 2.11 + (30 − 20) dni
    assert "absolwentów" in decision.warnings[0]
    assert decision.alternatives


def test_yes_verdict_gives_100_percent_in_pregnancy() -> None:
    decision = check_sickness_in_pregnancy(make_profile(sick_leaves=leave()), TODAY, PARAMS)
    assert decision.verdict is Verdict.YES
    assert "100%" in decision.summary
    assert decision.warnings == ()


def test_sick_leave_without_code_b_warns() -> None:
    decision = check_sickness_in_pregnancy(
        make_profile(sick_leaves=leave(code=None)), TODAY, PARAMS
    )
    assert decision.verdict is Verdict.YES
    assert "kodu „B”" in decision.warnings[0]


def test_without_sick_leave_checks_today_as_simulation() -> None:
    decision = check_sickness_in_pregnancy(make_profile(), TODAY, PARAMS)
    assert decision.verdict is Verdict.YES
    assert "Brak e-ZLA" in decision.assumptions[0]


# --- TE-23: przerwy w ubezpieczeniu ------------------------------------------------------


@pytest.mark.parametrize(("gap_days", "verdict"), [(30, Verdict.YES), (31, Verdict.NO)])
def test_previous_insurance_counts_only_after_short_gap(gap_days: int, verdict: Verdict) -> None:
    new_start = SICK_DAY - timedelta(days=10)
    old_end = new_start - timedelta(days=gap_days + 1)
    periods = [
        period("EMPLOYMENT", "MANDATORY", "2025-01-01", old_end.isoformat()),
        period("EMPLOYMENT", "MANDATORY", new_start.isoformat()),
    ]
    decision = check_sickness_in_pregnancy(
        make_profile(periods, sick_leaves=leave()), TODAY, PARAMS
    )
    assert decision.verdict is verdict


# --- brak ubezpieczenia, brak danych, działalność ----------------------------------------


def test_not_insured_on_sick_day_is_no_with_alternative() -> None:
    periods = [period("EMPLOYMENT", "MANDATORY", "2024-01-01", "2026-10-01")]
    decision = check_sickness_in_pregnancy(
        make_profile(periods, sick_leaves=leave()), TODAY, PARAMS
    )
    assert decision.verdict is Verdict.NO
    assert "14 dni po ustaniu" in decision.alternatives[0]


def test_mandate_without_sickness_insurance_is_no() -> None:
    decision = check_sickness_in_pregnancy(
        make_profile(insured_from(200, "NONE", "MANDATE_CONTRACT"), sick_leaves=leave()),
        TODAY,
        PARAMS,
    )
    assert decision.verdict is Verdict.NO


def test_missing_insurance_data_needs_info() -> None:
    decision = check_sickness_in_pregnancy(make_profile([]), TODAY, PARAMS)
    assert decision.verdict is Verdict.NEED_INFO
    assert decision.missing == ("applicant.insurance.periods",)


@pytest.mark.parametrize(
    ("debt", "verdict"),
    [(None, Verdict.NEED_INFO), ("250.00", Verdict.NEED_INFO), ("0", Verdict.YES)],
)
def test_business_debt(debt: str | None, verdict: Verdict) -> None:
    profile = make_profile(
        insured_from(200, "VOLUNTARY", "BUSINESS"), sick_leaves=leave(), debt=debt
    )
    decision = check_sickness_in_pregnancy(profile, TODAY, PARAMS)
    assert decision.verdict is verdict
    if debt == "250.00":
        assert decision.warnings
