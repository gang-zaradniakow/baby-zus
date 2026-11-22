"""Wykrywanie etapu ścieżki rodzica (E0–E3) i flag (ADOPTION, DIFFICULT) – ustalenie U3.

Zdarzenie wyznaczające etap („kotwica”): przyjęcie dziecka > data urodzenia > koniec ciąży
(poronienie, martwe urodzenie) > przewidywana data porodu.

- kotwica w przyszłości (albo tylko PDP): E0, gdy do niej > 6 tygodni; inaczej E1
  (także po terminie, dopóki nie ma daty urodzenia),
- kotwica w przeszłości: E2 do końca urlopu macierzyńskiego (lub na warunkach
  macierzyńskiego), potem E3.

To przybliżenie do wyboru listy pytań – dokładne okresy urlopów liczą kalkulatory (ZUS-15).
"""

from dataclasses import dataclass
from datetime import date, timedelta
from typing import Final

from contracts import Flag, Profile, SpecialEventKind, Stage, StageInfo
from rules_engine.params import NoParamsForDateError, ParamSet, current_params, get_params

#: Zdarzenia, przy których asystent przechodzi na ścieżkę „sytuacja trudna” (§1 pkt 6, §9.3).
DIFFICULT_EVENTS: Final = frozenset(
    {
        SpecialEventKind.MISCARRIAGE,
        SpecialEventKind.STILLBIRTH,
        SpecialEventKind.CHILD_DEATH,
        SpecialEventKind.MOTHER_DEATH,
    }
)
PREGNANCY_LOSS: Final = frozenset({SpecialEventKind.MISCARRIAGE, SpecialEventKind.STILLBIRTH})
MISSING_DATE_FIELD: Final = "child.expectedBirthDate"


@dataclass(frozen=True, slots=True)
class StageResult:
    stage: Stage | None
    flags: tuple[Flag, ...] = ()
    missing: tuple[str, ...] = ()
    """Pola potrzebne do ustalenia etapu (gdy ``stage is None``)."""

    def to_contract(self) -> StageInfo:
        return StageInfo(stage=self.stage, flags=list(self.flags))


def _params_for(day: date) -> ParamSet:
    try:
        return get_params(day)
    except NoParamsForDateError:
        # Zdarzenie sprzed zakresu silnika – do wyboru etapu wystarczą bieżące wymiary urlopów.
        return current_params()


def detect_flags(profile: Profile) -> tuple[Flag, ...]:
    flags: list[Flag] = []
    if profile.child.placement is not None:
        flags.append(Flag.ADOPTION)
    events = {event.kind for event in profile.special_events}
    if events & DIFFICULT_EVENTS or profile.child.za_zyciem:
        flags.append(Flag.DIFFICULT)
    return tuple(flags)


def _maternity_leave_end(profile: Profile, anchor: date, *, pregnancy_lost: bool) -> date:
    """Pierwszy dzień PO urlopie macierzyńskim liczonym od kotwicy (przybliżenie)."""
    params = _params_for(anchor)
    if pregnancy_lost:
        return anchor + timedelta(weeks=params.stillbirth_leave_weeks.value)
    end = anchor + timedelta(weeks=params.maternity_weeks_for(profile.child.children_count))
    deaths = [e.date_from for e in profile.special_events if e.kind is SpecialEventKind.CHILD_DEATH]
    limit = anchor + timedelta(weeks=params.child_death_age_limit_weeks.value)
    if deaths:
        # 7 dni od dnia zgonu (bez dnia zdarzenia – art. 111 KC); dokładne daty: leave_periods
        after_death = min(deaths) + timedelta(days=params.child_death_min_leave_days.value + 1)
        # zgon przed 8. tygodniem życia: 8 tyg. po porodzie, nie krócej niż 7 dni od zgonu;
        # zgon później: urlop kończy się 7 dni po zgonie (art. 180¹ § 2 KP)
        end = max(limit, after_death) if min(deaths) < limit else min(end, after_death)
    return end


def detect_stage(profile: Profile, today: date) -> StageResult:
    """Etap i flagi dla profilu w dniu ``today`` (data zawsze z zewnątrz – nie ``date.today()``)."""
    flags = detect_flags(profile)
    child = profile.child
    losses = [e.date_from for e in profile.special_events if e.kind in PREGNANCY_LOSS]

    anchor: date | None
    pregnancy_lost = False
    if child.placement is not None:
        anchor = child.placement.placement_date
    elif child.birth_date is not None:
        anchor = child.birth_date
        pregnancy_lost = bool(losses)
    elif losses:
        anchor, pregnancy_lost = min(losses), True
    else:
        anchor = None

    if anchor is not None and anchor <= today:
        end = _maternity_leave_end(profile, anchor, pregnancy_lost=pregnancy_lost)
        return StageResult(Stage.E2 if today < end else Stage.E3, flags)

    expected = anchor or child.expected_birth_date
    if expected is None:
        return StageResult(None, flags, (MISSING_DATE_FIELD,))
    prenatal_days = _params_for(expected).maternity_prenatal_max_weeks.value * 7
    return StageResult(Stage.E0 if (expected - today).days > prenatal_days else Stage.E1, flags)
