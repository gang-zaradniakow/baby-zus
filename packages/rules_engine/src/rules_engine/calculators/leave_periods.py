"""Wymiar urlopów jako konkretne daty (ZUS-15, kategoria C).

Konwencje:
- urlop „N tygodni” trwa ``7 × N`` dni kalendarzowych; ``end`` jest WŁĄCZNIE,
- wiek dziecka liczymy jak art. 112 KC: dziecko kończy 12 miesięcy z początkiem dnia
  pierwszych urodzin, więc ostatni dzień „do ukończenia 12 miesięcy” to dzień przed nimi,
- wymiary pochodzą z ``ParamSet`` (ZUS-10); błędne plany zgłaszają ``LeavePlanError``
  z komunikatem dla użytkownika.

Przypadki adopcji, wcześniaków i przejęcia urlopu przez ojca – ZUS-18; podział urlopu
rodzicielskiego na części i łączenie z pracą – ZUS-17.
"""

from collections.abc import Sequence
from dataclasses import dataclass
from datetime import date, timedelta
from itertools import pairwise
from typing import Final

from contracts import PeriodType
from rules_engine.formatting import format_date
from rules_engine.params import LegalBasis, ParamSet
from rules_engine.params.base import kp

BASIS_MATERNITY: Final = (kp("art. 180"),)
BASIS_LOSS: Final = (kp("art. 180¹ § 1"),)
BASIS_LATE_DEATH: Final = (kp("art. 180¹ § 2", to_verify=True),)
BASIS_PARENTAL: Final = (kp("art. 182¹a"), kp("art. 182¹b"))
BASIS_PATERNITY: Final = (kp("art. 182³"),)


class LeavePlanError(ValueError):
    """Plan urlopu sprzeczny z przepisami – komunikat jest gotowy dla użytkownika."""


@dataclass(frozen=True, slots=True)
class LeaveSpan:
    type: PeriodType
    start: date
    end: date
    """Ostatni dzień urlopu (włącznie)."""
    legal_basis: tuple[LegalBasis, ...]
    notes: tuple[str, ...] = ()

    def __post_init__(self) -> None:
        if self.end < self.start:
            raise ValueError("koniec urlopu przed początkiem")

    @property
    def days(self) -> int:
        return (self.end - self.start).days + 1

    @property
    def next_day(self) -> date:
        return self.end + timedelta(days=1)


def weeks_span(start: date, weeks: int) -> date:
    """Ostatni dzień okresu ``weeks`` tygodni zaczynającego się ``start``."""
    return start + timedelta(weeks=weeks) - timedelta(days=1)


def add_months(day: date, months: int) -> date:
    """Ta sama data ``months`` miesięcy później; 31.01 + 1 mies. → 28/29.02."""
    month_index = day.month - 1 + months
    year, month = day.year + month_index // 12, month_index % 12 + 1
    for candidate in (day.day, 30, 29, 28):
        try:
            return date(year, month, min(day.day, candidate))
        except ValueError:
            continue
    raise AssertionError("unreachable")  # pragma: no cover


def last_day_before_age(birth_date: date, *, months: int) -> date:
    """Ostatni dzień, w którym dziecko nie ukończyło jeszcze ``months`` miesięcy."""
    return add_months(birth_date, months) - timedelta(days=1)


# --- urlop macierzyński -----------------------------------------------------------------


def maternity_leave(
    birth_date: date,
    children: int,
    params: ParamSet,
    *,
    prenatal_start: date | None = None,
    due_date: date | None = None,
    stillbirth: bool = False,
    child_death: date | None = None,
) -> LeaveSpan:
    """Urlop macierzyński: wymiar wg liczby dzieci, opcjonalnie część przed porodem.

    ``birth_date`` – data porodu (rzeczywista albo przewidywana przy prognozie),
    ``due_date`` – przewidywana data porodu, od której liczymy limit 6 tygodni.
    """
    if stillbirth:
        weeks = params.stillbirth_leave_weeks.value
        return LeaveSpan(
            PeriodType.MACIERZYNSKI,
            birth_date,
            weeks_span(birth_date, weeks),
            BASIS_LOSS,
            (f"Po urodzeniu martwego dziecka – {weeks} tygodni od porodu.",),
        )

    weeks = params.maternity_weeks_for(children)
    start, notes = birth_date, []
    if prenatal_start is not None:
        reference = due_date or birth_date
        max_days = params.maternity_prenatal_max_weeks.value * 7
        if prenatal_start >= birth_date:
            raise LeavePlanError("Urlop przed porodem musi zacząć się przed dniem porodu.")
        if (reference - prenatal_start).days > max_days:
            earliest = reference - timedelta(days=max_days)
            raise LeavePlanError(
                f"Przed porodem możesz wykorzystać najwyżej "
                f"{params.maternity_prenatal_max_weeks.value} tygodni urlopu – "
                f"najwcześniej od {format_date(earliest)}."
            )
        start = prenatal_start
        notes.append(f"{(birth_date - start).days} dni urlopu przypada przed porodem.")

    end = weeks_span(start, weeks)
    mandatory_end = weeks_span(birth_date, params.maternity_mandatory_weeks.value)
    if end < mandatory_end:  # poród później niż przewidywano – po porodzie zawsze ≥ 14 tyg.
        end = mandatory_end
        notes.append("Poród po terminie – urlop trwa co najmniej 14 tygodni po porodzie.")

    if child_death is not None:
        limit = weeks_span(birth_date, params.child_death_age_limit_weeks.value)
        after_death = child_death + timedelta(days=params.child_death_min_leave_days.value)
        if child_death <= limit:
            notes.append(
                "Zgon dziecka przed ukończeniem 8 tygodni życia – urlop trwa 8 tygodni "
                "od porodu, nie krócej niż 7 dni od dnia zgonu."
            )
            end = min(end, max(limit, after_death))
            return LeaveSpan(PeriodType.MACIERZYNSKI, start, end, BASIS_LOSS, tuple(notes))
        if after_death < end:
            notes.append("Zgon dziecka – urlop kończy się 7 dni po dniu zgonu.")
            return LeaveSpan(
                PeriodType.MACIERZYNSKI, start, after_death, BASIS_LATE_DEATH, tuple(notes)
            )

    return LeaveSpan(PeriodType.MACIERZYNSKI, start, end, BASIS_MATERNITY, tuple(notes))


def check_maternity_resignation(birth_date: date, resign_from: date, params: ParamSet) -> None:
    """Matka może oddać resztę urlopu ojcu dopiero po 14 tygodniach od porodu."""
    earliest = birth_date + timedelta(weeks=params.maternity_mandatory_weeks.value)
    if resign_from < earliest:
        raise LeavePlanError(
            f"Matka musi wykorzystać co najmniej {params.maternity_mandatory_weeks.value} "
            f"tygodni urlopu po porodzie – rezygnacja możliwa od {format_date(earliest)}."
        )


# --- urlop rodzicielski -----------------------------------------------------------------


@dataclass(frozen=True, slots=True)
class ParentalEntitlement:
    total_weeks: int
    exclusive_weeks_per_parent: int
    """Tygodnie, których nie można przenieść na drugiego rodzica."""
    max_parts: int
    deadline: date
    """Ostatni dzień, do którego można wykorzystać urlop."""
    legal_basis: tuple[LegalBasis, ...] = BASIS_PARENTAL

    @property
    def max_weeks_one_parent(self) -> int:
        return self.total_weeks - self.exclusive_weeks_per_parent


def parental_entitlement(
    birth_date: date, children: int, params: ParamSet, *, za_zyciem: bool = False
) -> ParentalEntitlement:
    return ParentalEntitlement(
        total_weeks=params.parental_weeks_for(children, za_zyciem=za_zyciem),
        exclusive_weeks_per_parent=params.parental_nontransferable_weeks.value,
        max_parts=params.parental_max_parts.value,
        deadline=date(birth_date.year + params.parental_deadline_child_age_years.value, 12, 31),
    )


def check_parental_weeks(
    entitlement: ParentalEntitlement, mother_weeks: int, father_weeks: int
) -> None:
    """Podział tygodni między rodziców: pula łączna i 9 tygodni wyłącznie dla każdego."""
    if mother_weeks < 0 or father_weeks < 0:
        raise LeavePlanError("Liczba tygodni urlopu nie może być ujemna.")
    if mother_weeks + father_weeks > entitlement.total_weeks:
        raise LeavePlanError(
            f"Łącznie przysługuje {entitlement.total_weeks} tygodni urlopu rodzicielskiego."
        )
    limit = entitlement.max_weeks_one_parent
    for parent, weeks in (("Matka", mother_weeks), ("Ojciec", father_weeks)):
        if weeks > limit:
            raise LeavePlanError(
                f"{parent} może wykorzystać najwyżej {limit} tygodni – "
                f"{entitlement.exclusive_weeks_per_parent} tygodni przysługuje wyłącznie "
                "drugiemu rodzicowi i nie przechodzi na Ciebie."
            )


def parental_leave(start: date, weeks: int, entitlement: ParentalEntitlement) -> LeaveSpan:
    """Urlop rodzicielski w jednej części od ``start``."""
    end = weeks_span(start, weeks)
    if end > entitlement.deadline:
        raise LeavePlanError(
            f"Urlop rodzicielski trzeba wykorzystać do {format_date(entitlement.deadline)}."
        )
    return LeaveSpan(PeriodType.RODZICIELSKI, start, end, entitlement.legal_basis)


# --- urlop ojcowski ---------------------------------------------------------------------


def paternity_deadline(
    anchor: date, params: ParamSet, *, adopted_child_birth_date: date | None = None
) -> date:
    """Ostatni dzień urlopu ojcowskiego.

    ``anchor`` – data urodzenia dziecka albo uprawomocnienia postanowienia o przysposobieniu.
    Przy przysposobieniu – nie dłużej niż do ukończenia przez dziecko 14 lat.
    """
    deadline = last_day_before_age(anchor, months=params.paternity_deadline_months.value)
    if adopted_child_birth_date is not None:
        max_age = params.adoption_child_max_age.value
        deadline = min(deadline, last_day_before_age(adopted_child_birth_date, months=12 * max_age))
    return deadline


def paternity_leave(
    parts: Sequence[tuple[date, date]], anchor: date, deadline: date, params: ParamSet
) -> tuple[LeaveSpan, ...]:
    """Sprawdza i zwraca części urlopu ojcowskiego (każda część: ``(początek, koniec)``)."""
    max_parts = params.paternity_max_parts.value
    min_days = params.paternity_min_part_days.value
    total_days = params.paternity_leave_days.value
    if not parts or len(parts) > max_parts:
        raise LeavePlanError(f"Urlop ojcowski można podzielić najwyżej na {max_parts} części.")

    spans = tuple(
        sorted(
            (LeaveSpan(PeriodType.OJCOWSKI, s, e, BASIS_PATERNITY) for s, e in parts),
            key=lambda span: span.start,
        )
    )
    for span in spans:
        if span.days < min_days:
            raise LeavePlanError(
                f"Każda część urlopu ojcowskiego musi trwać co najmniej {min_days} dni."
            )
        if span.start < anchor or span.end > deadline:
            raise LeavePlanError(
                f"Urlop ojcowski można wykorzystać od {format_date(anchor)} "
                f"do {format_date(deadline)}."
            )
    for first, second in pairwise(spans):
        if second.start <= first.end:
            raise LeavePlanError("Części urlopu ojcowskiego nie mogą się nakładać.")
    if sum(span.days for span in spans) > total_days:
        raise LeavePlanError(f"Urlop ojcowski trwa łącznie {total_days} dni.")
    return spans
