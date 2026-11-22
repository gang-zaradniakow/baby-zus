"""Wymiar urlopów jako daty (TE-28…TE-36)."""

import re
from datetime import date, timedelta

import pytest

from contracts import PeriodType
from rules_engine.calculators.leave_periods import (
    LeavePlanError,
    LeaveSpan,
    add_months,
    check_maternity_resignation,
    check_parental_weeks,
    last_day_before_age,
    maternity_leave,
    parental_entitlement,
    parental_leave,
    paternity_deadline,
    paternity_leave,
    weeks_span,
)
from rules_engine.params import current_params

PARAMS = current_params()
BIRTH = date(2026, 11, 12)


def d(text: str) -> date:
    return date.fromisoformat(text)


# --- pomocnicze daty ---------------------------------------------------------------------


def test_weeks_span_is_inclusive() -> None:
    assert weeks_span(BIRTH, 1) == d("2026-11-18")
    assert weeks_span(BIRTH, 20) == d("2027-03-31")


@pytest.mark.parametrize(
    ("day", "months", "expected"),
    [
        ("2026-11-12", 12, "2027-11-12"),
        ("2026-01-31", 1, "2026-02-28"),
        ("2027-01-31", 13, "2028-02-29"),  # rok przestępny
        ("2026-03-31", 1, "2026-04-30"),
        ("2026-12-15", 1, "2027-01-15"),
    ],
)
def test_add_months(day: str, months: int, expected: str) -> None:
    assert add_months(d(day), months) == d(expected)


def test_last_day_before_age() -> None:
    assert last_day_before_age(BIRTH, months=12) == d("2027-11-11")


# --- TE-28: urlop macierzyński wg liczby dzieci -----------------------------------------


@pytest.mark.parametrize(
    ("children", "weeks"), [(1, 20), (2, 31), (3, 33), (4, 35), (5, 37), (7, 37)]
)
def test_maternity_leave_dates_by_children(children: int, weeks: int) -> None:
    span = maternity_leave(BIRTH, children, PARAMS)
    assert span.type is PeriodType.MACIERZYNSKI
    assert span.start == BIRTH
    assert span.days == weeks * 7
    assert span.next_day == BIRTH + timedelta(weeks=weeks)


# --- TE-29: najwyżej 6 tygodni przed porodem ---------------------------------------------


def test_prenatal_leave_max_6_weeks() -> None:
    due = d("2026-12-24")
    ok = maternity_leave(due, 1, PARAMS, prenatal_start=due - timedelta(weeks=6), due_date=due)
    assert ok.start == d("2026-11-12")
    assert ok.days == 20 * 7
    assert "42 dni" in ok.notes[0]

    with pytest.raises(LeavePlanError, match=re.escape("najwcześniej od 12.11.2026")):
        maternity_leave(due, 1, PARAMS, prenatal_start=due - timedelta(weeks=7), due_date=due)


def test_prenatal_start_must_be_before_birth() -> None:
    with pytest.raises(LeavePlanError, match="przed dniem porodu"):
        maternity_leave(BIRTH, 1, PARAMS, prenatal_start=BIRTH)


def test_late_birth_still_gives_14_weeks_after_birth() -> None:
    due = d("2026-12-24")
    birth = due + timedelta(days=14)  # poród 2 tygodnie po terminie, urlop od 6 tyg. przed terminem
    span = maternity_leave(birth, 1, PARAMS, prenatal_start=due - timedelta(weeks=6), due_date=due)
    assert span.end == weeks_span(birth, 14)
    assert any("po terminie" in note for note in span.notes)


# --- TE-30: 14 tygodni obowiązkowo dla matki ---------------------------------------------


def test_mother_mandatory_14_weeks() -> None:
    check_maternity_resignation(BIRTH, BIRTH + timedelta(weeks=14), PARAMS)
    with pytest.raises(LeavePlanError, match=re.escape("od 18.02.2027")):
        check_maternity_resignation(BIRTH, BIRTH + timedelta(weeks=13), PARAMS)


# --- TE-31, TE-32, TE-36: urlop rodzicielski --------------------------------------------


@pytest.mark.parametrize(
    ("children", "za_zyciem", "total", "one_parent"),
    [(1, False, 41, 32), (2, False, 43, 34), (1, True, 65, 56), (2, True, 67, 58)],
)
def test_parental_weeks(children: int, za_zyciem: bool, total: int, one_parent: int) -> None:
    entitlement = parental_entitlement(BIRTH, children, PARAMS, za_zyciem=za_zyciem)
    assert entitlement.total_weeks == total
    assert entitlement.exclusive_weeks_per_parent == 9
    assert entitlement.max_weeks_one_parent == one_parent
    assert entitlement.max_parts == 5


@pytest.mark.parametrize(
    ("mother", "father", "message"),
    [
        (41, 0, "Matka może wykorzystać najwyżej 32"),  # przejęcie 9 tygodni ojca
        (0, 33, "Ojciec może wykorzystać najwyżej 32"),
        (32, 10, "Łącznie przysługuje 41"),
        (-1, 9, "ujemna"),
    ],
)
def test_parental_nontransferable_9_weeks(mother: int, father: int, message: str) -> None:
    entitlement = parental_entitlement(BIRTH, 1, PARAMS)
    with pytest.raises(LeavePlanError, match=re.escape(message)):
        check_parental_weeks(entitlement, mother, father)


def test_parental_split_within_limits_is_ok() -> None:
    check_parental_weeks(parental_entitlement(BIRTH, 1, PARAMS), 32, 9)


@pytest.mark.parametrize(
    ("birth", "deadline"), [("2026-11-12", "2032-12-31"), ("2026-01-01", "2032-12-31")]
)
def test_parental_deadline_end_of_year_child_turns_6(birth: str, deadline: str) -> None:
    assert parental_entitlement(d(birth), 1, PARAMS).deadline == d(deadline)


def test_parental_leave_after_maternity() -> None:
    maternity = maternity_leave(BIRTH, 1, PARAMS)
    entitlement = parental_entitlement(BIRTH, 1, PARAMS)
    span = parental_leave(maternity.next_day, entitlement.max_weeks_one_parent, entitlement)
    assert span.start == d("2027-04-01")
    assert span.end == d("2027-11-10")  # 20 + 32 = 52 tygodnie od porodu
    assert span.type is PeriodType.RODZICIELSKI


def test_parental_leave_after_deadline_is_rejected() -> None:
    entitlement = parental_entitlement(BIRTH, 1, PARAMS)
    with pytest.raises(LeavePlanError, match=re.escape("do 31.12.2032")):
        parental_leave(d("2032-12-01"), 9, entitlement)


# --- TE-33, TE-34: urlop ojcowski ---------------------------------------------------------


def test_paternity_deadline_12_months() -> None:
    assert paternity_deadline(BIRTH, PARAMS) == d("2027-11-11")


def test_paternity_deadline_after_adoption_ruling() -> None:
    ruling = d("2026-09-01")
    assert paternity_deadline(ruling, PARAMS, adopted_child_birth_date=d("2015-01-01")) == d(
        "2027-08-31"
    )
    # dziecko kończy 14 lat wcześniej niż upływa 12 miesięcy od uprawomocnienia
    assert paternity_deadline(ruling, PARAMS, adopted_child_birth_date=d("2013-03-01")) == d(
        "2027-02-28"
    )


def test_paternity_in_two_parts_of_7_days() -> None:
    deadline = paternity_deadline(BIRTH, PARAMS)
    spans = paternity_leave(
        [(d("2027-01-04"), d("2027-01-10")), (d("2026-11-13"), d("2026-11-19"))],
        BIRTH,
        deadline,
        PARAMS,
    )
    assert [s.start for s in spans] == [d("2026-11-13"), d("2027-01-04")]  # posortowane
    assert sum(s.days for s in spans) == 14


@pytest.mark.parametrize(
    ("parts", "message"),
    [
        ([("2026-11-13", "2026-11-22"), ("2026-12-01", "2026-12-04")], "co najmniej 7 dni"),
        ([("2026-11-13", "2026-11-19")] * 3, "najwyżej na 2"),
        ([], "najwyżej na 2"),
        ([("2026-11-13", "2026-11-27")], "łącznie 14 dni"),
        ([("2026-11-13", "2026-11-20"), ("2026-11-19", "2026-11-25")], "nakładać"),
        ([("2027-11-08", "2027-11-14")], "do 11.11.2027"),
        ([("2026-11-05", "2026-11-11")], "od 12.11.2026"),
    ],
    ids=[
        "part_too_short",
        "too_many_parts",
        "no_parts",
        "too_long",
        "overlap",
        "after_deadline",
        "before_birth",
    ],
)
def test_paternity_invalid_plans(parts: list[tuple[str, str]], message: str) -> None:
    deadline = paternity_deadline(BIRTH, PARAMS)
    with pytest.raises(LeavePlanError, match=re.escape(message)):
        paternity_leave([(d(a), d(b)) for a, b in parts], BIRTH, deadline, PARAMS)


# --- TE-35: martwe urodzenie i zgon dziecka (T7) -----------------------------------------


def test_stillbirth_leave_8_weeks() -> None:
    span = maternity_leave(BIRTH, 1, PARAMS, stillbirth=True)
    assert span.days == 56
    assert span.end == d("2027-01-06")
    assert "8 tygodni" in span.notes[0]


@pytest.mark.parametrize(
    ("death", "end"),
    [
        ("2026-11-15", "2027-01-06"),  # zgon w 1. tygodniu: 8 tygodni od porodu
        ("2027-01-04", "2027-01-11"),  # zgon w 8. tygodniu: 7 dni od zgonu > 8 tygodni
        ("2027-02-01", "2027-02-08"),  # zgon po 8 tygodniach: urlop kończy się 7 dni po zgonie
        ("2027-03-28", "2027-03-31"),  # zgon tuż przed końcem urlopu – urlop się nie wydłuża
    ],
)
def test_child_death_shortens_leave(death: str, end: str) -> None:
    span = maternity_leave(BIRTH, 1, PARAMS, child_death=d(death))
    assert span.end == d(end)


def test_leave_span_rejects_end_before_start() -> None:
    with pytest.raises(ValueError, match="koniec urlopu"):
        LeaveSpan(PeriodType.OJCOWSKI, BIRTH, BIRTH - timedelta(days=1), ())
