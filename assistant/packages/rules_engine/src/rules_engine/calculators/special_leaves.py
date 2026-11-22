"""Urlopy w sytuacjach szczególnych (ZUS-18, kategoria F).

- urlop na warunkach urlopu macierzyńskiego przy przyjęciu dziecka (art. 183 KP),
- przejęcie części urlopu macierzyńskiego przez ojca (art. 180 KP),
- uzupełniający urlop macierzyński dla rodziców wcześniaków i hospitalizowanych noworodków
  (od 19.03.2025).

Konwencje jak w ``leave_periods``: tydzień = 7 dni kalendarzowych, ``end`` włącznie,
dzień porodu jest pierwszym dniem urlopu macierzyńskiego. Funkcje zgłaszają
``LeavePlanError`` z komunikatem dla użytkownika, gdy uprawnienie nie przysługuje.
"""

import math
from collections.abc import Iterable, Sequence
from dataclasses import dataclass
from datetime import date, timedelta
from typing import Final

from contracts import PeriodType, PlacementKind, SpecialEvent, SpecialEventKind
from rules_engine.calculators.leave_periods import (
    LeavePlanError,
    LeaveSpan,
    maternity_leave,
    weeks_span,
)
from rules_engine.formatting import format_date
from rules_engine.params import ParamSet
from rules_engine.params.base import SupplementaryCriteria, kp

BASIS_ADOPTION: Final = (kp("art. 183"),)
BASIS_MOTHER_MINIMUM: Final = kp("art. 180 § 13")
BASIS_TAKEOVER: Final = {
    SpecialEventKind.MOTHER_HOSPITALIZATION: (kp("art. 180 § 6¹"), kp("art. 180 § 10")),
    SpecialEventKind.MOTHER_DEATH: (kp("art. 180 § 12"),),
    SpecialEventKind.CHILD_ABANDONMENT: (kp("art. 180 § 7", to_verify=True),),
    SpecialEventKind.MOTHER_UNABLE_TO_CARE: (kp("art. 180 § 6"),),
}
TAKEOVER_EVENTS: Final = frozenset(BASIS_TAKEOVER)
BASIS_SUPPLEMENTARY: Final = (
    kp("przepisy o uzupełniającym urlopie macierzyńskim", to_verify=True),
)
MOTHER_MIN_WEEKS: Final = 8
"""Matka zawsze wykorzystuje co najmniej 8 tygodni po porodzie (poza jej zgonem)."""

PLACEMENT_NAMES: Final = {
    PlacementKind.ADOPTION: "przysposobienie",
    PlacementKind.FOSTER_FAMILY: "rodzina zastępcza",
}


def years_later(day: date, years: int) -> date:
    """Ta sama data ``years`` lat później; 29.02 → 28.02 w roku nieprzestępnym."""
    try:
        return day.replace(year=day.year + years)
    except ValueError:
        return day.replace(year=day.year + years, day=28)


def last_day_before_years(birth_date: date, years: int) -> date:
    """Ostatni dzień, w którym dziecko nie ukończyło ``years`` lat (art. 112 KC)."""
    return years_later(birth_date, years) - timedelta(days=1)


# --- adopcja i rodzina zastępcza ------------------------------------------------------


def placement_age_limit(
    kind: PlacementKind, params: ParamSet, *, school_deferral: bool = False
) -> int:
    """Wiek, do którego ukończenia przysługuje urlop na warunkach macierzyńskiego."""
    if kind is PlacementKind.ADOPTION:
        return params.adoption_child_max_age.value
    if school_deferral:
        return params.foster_child_max_age_school_deferral.value
    return params.foster_child_max_age.value


def adoption_leave(
    kind: PlacementKind,
    child_birth_date: date,
    placement_date: date,
    children: int,
    params: ParamSet,
    *,
    school_deferral: bool = False,
) -> LeaveSpan:
    """Urlop na warunkach urlopu macierzyńskiego od dnia przyjęcia dziecka.

    Wymiar jak urlop macierzyński (tabela wg liczby dzieci), ale nie dłużej niż do
    ukończenia przez dziecko granicy wieku (14 lat; rodzina zastępcza 7, przy odroczeniu
    obowiązku szkolnego 10).
    """
    age_limit = placement_age_limit(kind, params, school_deferral=school_deferral)
    last_day = last_day_before_years(child_birth_date, age_limit)
    if placement_date > last_day:
        hint = (
            " Przy odroczonym obowiązku szkolnym granica wynosi "
            f"{params.foster_child_max_age_school_deferral.value} lat."
            if kind is PlacementKind.FOSTER_FAMILY and not school_deferral
            else ""
        )
        raise LeavePlanError(
            f"W dniu przyjęcia ({format_date(placement_date)}) dziecko ukończyło już "
            f"{age_limit} lat – urlop na warunkach urlopu macierzyńskiego "
            f"({PLACEMENT_NAMES[kind]}) nie przysługuje.{hint}"
        )
    weeks = params.maternity_weeks_for(children)
    end = weeks_span(placement_date, weeks)
    notes = [f"Wymiar jak urlop macierzyński: {weeks} tygodni od dnia przyjęcia dziecka."]
    if end > last_day:
        end = last_day
        notes.append(
            f"Urlop kończy się dzień przed ukończeniem przez dziecko {age_limit} lat "
            f"({format_date(last_day)})."
        )
    return LeaveSpan(
        PeriodType.NA_WARUNKACH_MACIERZYNSKIEGO,
        placement_date,
        end,
        BASIS_ADOPTION,
        tuple(notes),
    )


# --- przejęcie urlopu macierzyńskiego przez ojca --------------------------------------


def earliest_father_start(birth_date: date) -> date:
    """Pierwszy dzień po 8 tygodniach urlopu matki po porodzie."""
    return birth_date + timedelta(weeks=MOTHER_MIN_WEEKS)


def father_takeover_leave(
    birth_date: date, children: int, event: SpecialEvent, params: ParamSet
) -> LeaveSpan:
    """Część urlopu macierzyńskiego, którą przejmuje ojciec po zdarzeniu dotyczącym matki.

    - pobyt matki w szpitalu – za okres pobytu, ale dopiero po 8 tygodniach od porodu,
    - zgon matki – cała pozostała część od dnia po zgonie,
    - porzucenie dziecka – pozostała część, nie wcześniej niż po 8 tygodniach,
    - orzeczenie o niezdolności matki do samodzielnej egzystencji – pozostała część
      od rezygnacji matki, nie wcześniej niż po 8 tygodniach.

    Przyjmujemy, że matka nie korzystała z urlopu przed porodem (koniec urlopu liczony
    od dnia porodu).
    """
    if event.kind not in TAKEOVER_EVENTS:
        raise ValueError(f"zdarzenie {event.kind} nie daje prawa do przejęcia urlopu")
    maternity_end = maternity_leave(birth_date, children, params).end
    basis = BASIS_TAKEOVER[event.kind]
    notes: list[str] = []

    if event.kind is SpecialEventKind.MOTHER_DEATH:
        if event.date_from < birth_date:
            raise LeavePlanError("Data zgonu matki jest wcześniejsza niż data porodu.")
        start = event.date_from + timedelta(days=1)
        notes.append("Po zgonie matki pozostała część urlopu przysługuje ojcu w całości.")
    else:
        earliest = earliest_father_start(birth_date)
        start = max(event.date_from + _start_offset(event.kind), earliest)
        basis = (*basis, BASIS_MOTHER_MINIMUM)
        if start == earliest and event.date_from + _start_offset(event.kind) < earliest:
            notes.append(
                f"Matka musi wykorzystać co najmniej {MOTHER_MIN_WEEKS} tygodni urlopu po "
                f"porodzie – ojciec może zacząć od {format_date(earliest)}."
            )

    end = maternity_end
    if event.kind is SpecialEventKind.MOTHER_HOSPITALIZATION:
        if event.date_to is None:
            notes.append(
                "Brak daty wypisu matki – pokazano okres do końca urlopu macierzyńskiego; "
                "po powrocie matki ze szpitala urlop wraca do niej."
            )
        else:
            end = min(end, event.date_to)
            notes.append("Po wypisie matki ze szpitala urlop macierzyński wraca do niej.")

    if start > end:
        raise LeavePlanError(
            "Nie ma części urlopu macierzyńskiego do przejęcia – zdarzenie przypada po "
            "jego końcu albo kończy się przed upływem 8 tygodni od porodu."
        )
    return LeaveSpan(PeriodType.MACIERZYNSKI, start, end, basis, tuple(notes))


def _start_offset(kind: SpecialEventKind) -> timedelta:
    """Porzucenie: od dnia następnego; szpital i rezygnacja: od dnia zdarzenia."""
    return timedelta(days=1) if kind is SpecialEventKind.CHILD_ABANDONMENT else timedelta(0)


# --- uzupełniający urlop macierzyński ------------------------------------------------


@dataclass(frozen=True, slots=True)
class HospitalStay:
    start: date
    end: date
    """Ostatni dzień pobytu (włącznie)."""


@dataclass(frozen=True, slots=True)
class SupplementaryGroup:
    number: int
    """1 – skrajny wcześniak / masa ≤ 1000 g, 2 – wcześniak, 3 – dziecko donoszone."""
    window_start: date
    window_end: date
    max_weeks: int


def supplementary_group(
    birth_date: date,
    gestational_weeks: int,
    birth_weight_g: int | None,
    criteria: SupplementaryCriteria,
    max_weeks: tuple[int, int],
) -> SupplementaryGroup:
    """Grupa wg ukończonych tygodni ciąży i masy urodzeniowej (najmniejszej przy mnogim)."""
    short_max, long_max = max_weeks
    low_weight = birth_weight_g is not None and birth_weight_g <= criteria.low_weight_g
    if gestational_weeks < criteria.very_preterm_weeks or low_weight:
        return SupplementaryGroup(
            1, birth_date, weeks_span(birth_date, criteria.long_window_weeks), long_max
        )
    short_end = weeks_span(birth_date, criteria.short_window_weeks)
    if gestational_weeks < criteria.term_weeks:
        if birth_weight_g is None:
            raise LeavePlanError(
                "Dla dziecka urodzonego między 28. a 37. tygodniem ciąży potrzebna jest "
                "masa urodzeniowa."
            )
        return SupplementaryGroup(2, birth_date, short_end, short_max)
    start = birth_date + timedelta(days=criteria.term_first_day)
    return SupplementaryGroup(3, start, short_end, short_max)


def merge_stays(stays: Iterable[HospitalStay]) -> list[HospitalStay]:
    """Scala nakładające się i przylegające pobyty (dzień liczymy raz)."""
    merged: list[HospitalStay] = []
    for stay in sorted(stays, key=lambda s: s.start):
        if merged and stay.start <= merged[-1].end + timedelta(days=1):
            last = merged[-1]
            merged[-1] = HospitalStay(last.start, max(last.end, stay.end))
        else:
            merged.append(stay)
    return merged


def stay_days_in(stays: Sequence[HospitalStay], start: date, end: date) -> int:
    """Liczba dni pobytu w oknie ``[start, end]`` (pobyty już scalone)."""
    total = 0
    for stay in stays:
        first, last = max(stay.start, start), min(stay.end, end)
        if first <= last:
            total += (last - first).days + 1
    return total


def _term_condition_met(
    stays: Sequence[HospitalStay], birth_date: date, criteria: SupplementaryCriteria
) -> bool:
    """Grupa 3: pobyt ≥ 2 kolejne dni, pierwszy z nich w dniach 5–28 po porodzie."""
    earliest = birth_date + timedelta(days=criteria.term_first_day)
    latest = birth_date + timedelta(days=criteria.term_first_day_last)
    for stay in stays:
        first = max(stay.start, earliest)
        if first <= latest and (stay.end - first).days + 1 >= criteria.term_min_stay_days:
            return True
    return False


def supplementary_maternity_leave(
    birth_date: date,
    children: int,
    gestational_weeks: int,
    birth_weight_g: int | None,
    stays: Sequence[HospitalStay],
    params: ParamSet,
) -> LeaveSpan:
    """Uzupełniający urlop macierzyński – bezpośrednio po urlopie macierzyńskim.

    Tydzień urlopu za każdy rozpoczęty tydzień pobytu dziecka w szpitalu w oknie grupy;
    pobyty sumuje się, niepełny tydzień zaokrągla się w górę.
    """
    if params.supplementary_maternity_criteria is None or (
        params.supplementary_maternity_max_weeks is None
    ):
        raise LeavePlanError(
            "Uzupełniający urlop macierzyński obowiązuje od 19.03.2025 – dla wcześniejszych "
            "porodów decydują przepisy przejściowe, zapytaj ZUS."
        )
    criteria = params.supplementary_maternity_criteria.value
    group = supplementary_group(
        birth_date,
        gestational_weeks,
        birth_weight_g,
        criteria,
        params.supplementary_maternity_max_weeks.value,
    )
    merged = merge_stays(stays)
    if group.number == 3 and not _term_condition_met(merged, birth_date, criteria):
        raise LeavePlanError(
            "Przy dziecku donoszonym urlop uzupełniający przysługuje, gdy pobyt w szpitalu "
            f"trwał co najmniej {criteria.term_min_stay_days} kolejne dni, a pierwszy z nich "
            f"przypadł między {criteria.term_first_day}. a {criteria.term_first_day_last}. "
            "dniem po porodzie."
        )
    days = stay_days_in(merged, group.window_start, group.window_end)
    if days == 0:
        raise LeavePlanError(
            f"Brak pobytu dziecka w szpitalu w okresie {format_date(group.window_start)} – "
            f"{format_date(group.window_end)} – urlop uzupełniający nie przysługuje."
        )
    weeks = min(math.ceil(days / 7), group.max_weeks)
    start = maternity_leave(birth_date, children, params).next_day
    notes = (
        f"Grupa {group.number}: {days} dni pobytu w szpitalu w okresie "
        f"{format_date(group.window_start)} – {format_date(group.window_end)} → {weeks} "
        f"tyg. (każdy rozpoczęty tydzień pobytu = tydzień urlopu, maks. {group.max_weeks}).",
        "Urlop jest udzielany jednorazowo, bezpośrednio po urlopie macierzyńskim, "
        "nie można go dzielić.",
    )
    return LeaveSpan(
        PeriodType.UZUPELNIAJACY_MACIERZYNSKI,
        start,
        weeks_span(start, weeks),
        BASIS_SUPPLEMENTARY,
        notes,
    )
