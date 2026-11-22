"""Podział urlopu rodzicielskiego i praca do ½ etatu (TE-42…TE-49, scenariusz T9)."""

import re
from datetime import date, timedelta
from decimal import Decimal

import pytest
from hypothesis import given
from hypothesis import strategies as st

from contracts import ParentRole, Period
from rules_engine.calculators.leave_periods import (
    LeavePlanError,
    ParentalEntitlement,
    parental_entitlement,
)
from rules_engine.calculators.parental_split import (
    ParentalPart,
    calc_parental_split,
    calc_part_time,
    max_weeks_with_work,
)
from rules_engine.params import current_params

PARAMS = current_params()
BIRTH = date(2026, 11, 12)
START = date(2027, 4, 1)  # dzień po urlopie macierzyńskim
M, F = ParentRole.MOTHER, ParentRole.FATHER
HALF = Decimal("0.5")


def entitlement(children: int = 1, za_zyciem: bool = False) -> ParentalEntitlement:
    return parental_entitlement(BIRTH, children, PARAMS, za_zyciem=za_zyciem)


def weeks_later(weeks: int) -> date:
    return START + timedelta(weeks=weeks)


# --- TE-42: równoczesne korzystanie w ramach puli ----------------------------------------


def test_parental_split_parallel_within_pool() -> None:
    plan = calc_parental_split(
        [ParentalPart(M, START, 16), ParentalPart(F, START, 16)], entitlement(), PARAMS
    )
    assert plan.weeks_by_parent == {M: 16, F: 16}
    assert plan.remaining_weeks == 9
    assert {p.end for p in plan.parts} == {date(2027, 7, 21)}


def test_alternating_split_uses_whole_pool() -> None:
    plan = calc_parental_split(
        [ParentalPart(M, START, 32), ParentalPart(F, weeks_later(32), 9)], entitlement(), PARAMS
    )
    assert plan.remaining_weeks == 0
    assert plan.parts[1].part.parent is F


def test_father_can_split_his_9_weeks_into_4_parts() -> None:
    """Przykład z literatury: matka 1 część, ojciec 4 części – razem 5."""
    parts = [ParentalPart(M, START, 32)] + [
        ParentalPart(F, weeks_later(32 + 3 * i), w) for i, w in enumerate([3, 2, 2, 2])
    ]
    assert len(calc_parental_split(parts, entitlement(), PARAMS).parts) == 5


# --- TE-43: najwyżej 5 części łącznie -----------------------------------------------------


def test_parental_split_max_5_parts_for_both_parents() -> None:
    parts = [ParentalPart(M, weeks_later(4 * i), 2) for i in range(3)]
    parts += [ParentalPart(F, weeks_later(4 * i + 2), 2) for i in range(3)]
    with pytest.raises(LeavePlanError, match="najwyżej na 5 części"):
        calc_parental_split(parts, entitlement(), PARAMS)


# --- TE-44: pula i nieprzenoszalne 9 tygodni ---------------------------------------------


@pytest.mark.parametrize(
    ("parts", "message"),
    [
        ([ParentalPart(M, START, 32), ParentalPart(F, START, 10)], "Łącznie przysługuje 41"),
        ([ParentalPart(M, START, 33)], "Matka może wykorzystać najwyżej 32"),
        ([ParentalPart(F, START, 20), ParentalPart(F, weeks_later(20), 13)], "Ojciec może"),
        ([], "nie ma żadnej części"),
        ([ParentalPart(M, START, 0)], "co najmniej jeden pełny tydzień"),
    ],
    ids=[
        "pool_exceeded",
        "mother_takes_fathers_weeks",
        "father_takes_mothers_weeks",
        "empty",
        "zero_weeks",
    ],
)
def test_parental_split_invalid_plans(parts: list[ParentalPart], message: str) -> None:
    with pytest.raises(LeavePlanError, match=message):
        calc_parental_split(parts, entitlement(), PARAMS)


def test_same_parent_parts_cannot_overlap() -> None:
    parts = [ParentalPart(M, START, 10), ParentalPart(M, weeks_later(5), 10)]
    with pytest.raises(LeavePlanError, match="Matka: części urlopu nie mogą się nakładać"):
        calc_parental_split(parts, entitlement(), PARAMS)


def test_part_after_deadline_is_rejected() -> None:
    with pytest.raises(LeavePlanError, match=re.escape("do 31.12.2032")):
        calc_parental_split([ParentalPart(M, date(2032, 12, 1), 9)], entitlement(), PARAMS)


# --- TE-45: kwoty od podstawy każdego rodzica --------------------------------------------


def test_split_amounts_use_each_parent_base() -> None:
    plan = calc_parental_split(
        [ParentalPart(M, START, 16), ParentalPart(F, START, 16)], entitlement(), PARAMS
    )
    periods = plan.benefit_periods({M: Decimal("6000.00"), F: Decimal("9000.00")}, Decimal("0.70"))
    by_monthly = sorted(p.monthly for p in periods)
    assert by_monthly == [Decimal("4200.00"), Decimal("6300.00")]
    assert sorted(p.amount for p in periods) == [
        Decimal("15680.00"),
        Decimal("23520.00"),
    ]  # 112 dni


def test_split_amounts_need_both_bases() -> None:
    plan = calc_parental_split([ParentalPart(F, START, 9)], entitlement(), PARAMS)
    with pytest.raises(LeavePlanError, match="Brak podstawy wymiaru: Ojciec"):
        plan.benefit_periods({M: Decimal("6000.00")}, Decimal("0.70"))


# --- TE-46 / T9: praca na ½ etatu --------------------------------------------------------


def test_t9_part_time_extends_leave_and_halves_daily_benefit() -> None:
    planned = calc_part_time(ParentalPart(M, START, 8, HALF), entitlement(), PARAMS)
    assert planned.calendar_days == 16 * 7  # 8 tygodni puli → 16 tygodni w kalendarzu
    assert planned.extension_days == 8 * 7
    assert planned.end == weeks_later(16) - timedelta(days=1)

    plan = calc_parental_split([ParentalPart(M, START, 8, HALF)], entitlement(), PARAMS)
    [period] = plan.benefit_periods({M: Decimal("6000.00")}, Decimal("0.70"))
    assert period.rate == Decimal("0.3500")
    assert period.daily == Decimal("70.00")  # 140,00 × ½
    assert period.amount == Decimal("7840.00")  # tyle co 8 tygodni bez pracy: 56 × 140,00
    Period.model_validate(period.to_contract().model_dump())  # zgodne z kontraktem


# --- TE-47: limit wymiaru pracy ----------------------------------------------------------


@pytest.mark.parametrize("fraction", ["0.6", "1", "-0.1"])
def test_part_time_over_half_rejected(fraction: str) -> None:
    with pytest.raises(LeavePlanError, match="najwyżej na 50% etatu"):
        calc_part_time(ParentalPart(M, START, 8, Decimal(fraction)), entitlement(), PARAMS)


# --- TE-48: praca nie zmienia sumy zasiłku -----------------------------------------------


@given(
    st.integers(min_value=1, max_value=32),
    st.sampled_from(["0", "0.1", "0.2", "0.25", "0.3", "0.4", "0.5"]),
    st.decimals(min_value=Decimal("1000"), max_value=Decimal("30000"), places=2),
)
def test_part_time_total_amount_invariant(weeks: int, fraction: str, base: Decimal) -> None:
    part = ParentalPart(M, START, weeks, Decimal(fraction))
    plan = calc_parental_split([part], entitlement(), PARAMS)
    [with_work] = plan.benefit_periods({M: base}, Decimal("0.70"))
    plain = calc_parental_split([ParentalPart(M, START, weeks)], entitlement(), PARAMS)
    [without_work] = plain.benefit_periods({M: base}, Decimal("0.70"))
    # różnica tylko z zaokrągleń: dni w dół i stawka dzienna do grosza
    assert abs(with_work.amount - without_work.amount) <= 2 * without_work.daily + Decimal("1")


# --- TE-49: limit po wydłużeniu ----------------------------------------------------------


@pytest.mark.parametrize(
    ("children", "za_zyciem", "limit"),
    [(1, False, 82), (2, False, 86), (1, True, 130), (2, True, 134)],
)
def test_max_extension_matches_labour_code(children: int, za_zyciem: bool, limit: int) -> None:
    assert max_weeks_with_work(entitlement(children, za_zyciem), PARAMS) == limit


def test_whole_leave_at_half_time_reaches_limit_exactly() -> None:
    parts = [ParentalPart(M, START, 32, HALF), ParentalPart(F, date(2028, 9, 1), 9, HALF)]
    plan = calc_parental_split(parts, entitlement(), PARAMS)
    assert sum(p.calendar_days for p in plan.parts) == 82 * 7
    assert plan.max_calendar_weeks == 82


def test_calendar_days_round_down_for_odd_fractions() -> None:
    planned = calc_part_time(ParentalPart(M, START, 1, Decimal("0.4")), entitlement(), PARAMS)
    assert planned.calendar_days == 11  # 7 / 0,6 = 11,67 → 11
