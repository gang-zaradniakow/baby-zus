"""Okresy ubezpieczenia: scalanie, rodzaj ubezpieczenia, dni do okresu wyczekiwania."""

from datetime import date

from contracts import InsurancePeriod, SicknessInsurance
from rules_engine.formatting import format_date
from rules_engine.insurance import (
    insured_days_before,
    latest_start,
    merged_sickness_spans,
    sickness_kind_on,
)
from rules_engine.testing import make_profile, period


def periods(*items: dict[str, str]) -> list[InsurancePeriod]:
    return make_profile(list(items)).applicant.insurance.periods


def test_overlapping_and_adjacent_periods_are_merged() -> None:
    spans = merged_sickness_spans(
        periods(
            period(start="2025-01-01", end="2025-06-30"),
            period(start="2025-07-01", end="2025-09-30"),  # styka się
            period(start="2025-09-01", end="2025-12-31"),  # nakłada się
            period(start="2026-03-01"),  # po przerwie
        )
    )
    assert spans == [(date(2025, 1, 1), date(2025, 12, 31)), (date(2026, 3, 1), date.max)]


def test_open_ended_period_absorbs_later_ones() -> None:
    spans = merged_sickness_spans(periods(period(start="2025-01-01"), period(start="2025-05-01")))
    assert spans == [(date(2025, 1, 1), date.max)]


def test_mandatory_insurance_wins_over_voluntary() -> None:
    ps = periods(period("EMPLOYMENT", "MANDATORY"), period("MANDATE_CONTRACT", "VOLUNTARY"))
    assert sickness_kind_on(date(2026, 1, 1), ps) is SicknessInsurance.MANDATORY


def test_no_insurance_on_day() -> None:
    ps = periods(period(start="2026-01-01"))
    assert insured_days_before(date(2025, 12, 31), ps) is None
    assert sickness_kind_on(date(2025, 12, 31), ps) is SicknessInsurance.NONE


def test_gap_days_are_not_counted_but_earlier_period_is() -> None:
    ps = periods(
        period(start="2026-01-01", end="2026-01-10"),  # 10 dni
        period(start="2026-01-21"),  # przerwa 10 dni
    )
    assert insured_days_before(date(2026, 1, 31), ps) == 10 + 10


def test_latest_start() -> None:
    assert latest_start(periods(period(start="2024-01-01"), period(start="2025-02-03"))) == date(
        2025, 2, 3
    )
    assert latest_start([]) is None


def test_format_date() -> None:
    assert format_date(date(2026, 3, 5)) == "05.03.2026"
