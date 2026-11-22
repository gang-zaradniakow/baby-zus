"""Podział urlopu rodzicielskiego między rodziców i łączenie z pracą (ZUS-17, kategorie D, E).

Zasady (art. 182¹a–182¹f KP, stan od 26.04.2023):
- pula przysługuje łącznie obojgu rodzicom; każdy ma 9 tygodni nieprzenoszalnych,
- rodzice mogą korzystać jednocześnie – liczy się suma tygodni z puli,
- urlop udziela się w pełnych tygodniach, jednorazowo albo w najwyżej 5 częściach
  ŁĄCZNIE dla obojga rodziców; części nie mają minimalnej długości,
- praca u pracodawcy udzielającego urlopu – najwyżej ½ etatu; urlop wydłuża się
  proporcjonalnie, nie dłużej niż do 82/86 tygodni (130/134 przy „Za życiem”),
- za czas łączenia z pracą dzienny zasiłek maleje proporcjonalnie do wymiaru pracy.

Model części z pracą: ``E`` tygodni puli przy pracy ``f`` etatu trwa w kalendarzu
``E × 7 / (1 − f)`` dni (zaokrąglone w dół), a zasiłek za dzień = stawka dzienna × (1 − f).
Zakładamy, że część powstała z wydłużenia też jest łączona z pracą w tym samym wymiarze.
"""

import math
from collections import defaultdict
from dataclasses import dataclass
from datetime import date, timedelta
from decimal import Decimal
from itertools import pairwise
from typing import Final

from contracts import ParentRole, PeriodType
from rules_engine.calculators.leave_periods import LeavePlanError, ParentalEntitlement
from rules_engine.calculators.maternity import DAYS_IN_BENEFIT_MONTH, BenefitPeriod
from rules_engine.formatting import format_date, format_percent, money
from rules_engine.params import ParamSet
from rules_engine.params.base import kp

BASIS_SPLIT: Final = (kp("art. 182¹a"), kp("art. 182¹b"))
BASIS_WORK: Final = (kp("art. 182¹e"), kp("art. 182¹f"))
RATE_PLACES: Final = Decimal("0.0001")
PARENT_NAMES: Final = {ParentRole.MOTHER: "Matka", ParentRole.FATHER: "Ojciec"}


@dataclass(frozen=True, slots=True)
class ParentalPart:
    """Część urlopu z wniosku: ile tygodni PULI i od kiedy; opcjonalnie praca."""

    parent: ParentRole
    start: date
    weeks: int
    work_fraction: Decimal = Decimal(0)


@dataclass(frozen=True, slots=True)
class PlannedPart:
    part: ParentalPart
    end: date
    """Ostatni dzień części w kalendarzu (włącznie), z wydłużeniem za pracę."""

    @property
    def calendar_days(self) -> int:
        return (self.end - self.part.start).days + 1

    @property
    def extension_days(self) -> int:
        return self.calendar_days - self.part.weeks * 7


@dataclass(frozen=True, slots=True)
class ParentalPlan:
    parts: tuple[PlannedPart, ...]
    entitlement: ParentalEntitlement
    weeks_by_parent: dict[ParentRole, int]
    max_calendar_weeks: int

    @property
    def remaining_weeks(self) -> int:
        return self.entitlement.total_weeks - sum(self.weeks_by_parent.values())

    def benefit_periods(
        self, bases: dict[ParentRole, Decimal], rate: Decimal
    ) -> tuple[BenefitPeriod, ...]:
        """Kwoty dla każdej części – od podstawy wymiaru TEGO rodzica (TE-45)."""
        periods: list[BenefitPeriod] = []
        for planned in self.parts:
            part = planned.part
            if part.parent not in bases:
                raise LeavePlanError(f"Brak podstawy wymiaru: {PARENT_NAMES[part.parent]}.")
            base = bases[part.parent]
            keep = 1 - part.work_fraction
            periods.append(
                BenefitPeriod(
                    PeriodType.RODZICIELSKI,
                    part.start,
                    planned.end,
                    (rate * keep).quantize(RATE_PLACES),
                    money(base * rate * keep),
                    money(money(base * rate / DAYS_IN_BENEFIT_MONTH) * keep),
                )
            )
        return tuple(periods)


def max_weeks_with_work(entitlement: ParentalEntitlement, params: ParamSet) -> int:
    """Limit długości urlopu po wydłużeniu: pula / (1 − ½) → 82, 86, 130 albo 134 tygodnie."""
    return int(entitlement.total_weeks / (1 - params.part_time_max_fraction.value))


def calendar_end(part: ParentalPart) -> date:
    days = math.floor(Decimal(part.weeks * 7) / (1 - part.work_fraction))
    return part.start + timedelta(days=days - 1)


def calc_parental_split(
    parts: list[ParentalPart], entitlement: ParentalEntitlement, params: ParamSet
) -> ParentalPlan:
    """Sprawdza plan urlopu rodzicielskiego i wylicza daty części (D.02, D.03, E.01–E.05)."""
    if not parts:
        raise LeavePlanError("Plan urlopu rodzicielskiego nie ma żadnej części.")
    if len(parts) > entitlement.max_parts:
        raise LeavePlanError(
            f"Urlop rodzicielski można podzielić najwyżej na {entitlement.max_parts} części "
            "łącznie dla obojga rodziców."
        )

    max_fraction = params.part_time_max_fraction.value
    for part in parts:
        if part.weeks < 1:
            raise LeavePlanError("Każda część urlopu to co najmniej jeden pełny tydzień.")
        if not Decimal(0) <= part.work_fraction <= max_fraction:
            raise LeavePlanError(
                f"Na urlopie rodzicielskim możesz pracować najwyżej na "
                f"{format_percent(max_fraction)} etatu."
            )

    weeks_by_parent: dict[ParentRole, int] = defaultdict(int)
    for part in parts:
        weeks_by_parent[part.parent] += part.weeks
    if sum(weeks_by_parent.values()) > entitlement.total_weeks:
        raise LeavePlanError(
            f"Łącznie przysługuje {entitlement.total_weeks} tygodni urlopu rodzicielskiego – "
            f"plan obejmuje {sum(weeks_by_parent.values())}."
        )
    for parent, weeks in weeks_by_parent.items():
        if weeks > entitlement.max_weeks_one_parent:
            raise LeavePlanError(
                f"{PARENT_NAMES[parent]} może wykorzystać najwyżej "
                f"{entitlement.max_weeks_one_parent} tygodni – "
                f"{entitlement.exclusive_weeks_per_parent} tygodni przysługuje wyłącznie "
                "drugiemu rodzicowi."
            )

    planned = tuple(
        sorted((PlannedPart(p, calendar_end(p)) for p in parts), key=lambda x: x.part.start)
    )
    for item in planned:
        if item.end > entitlement.deadline:
            raise LeavePlanError(
                f"Urlop rodzicielski trzeba wykorzystać do {format_date(entitlement.deadline)} – "
                f"część od {format_date(item.part.start)} kończy się {format_date(item.end)}."
            )
    for parent in weeks_by_parent:
        own = [p for p in planned if p.part.parent is parent]
        for first, second in pairwise(own):
            if second.part.start <= first.end:
                raise LeavePlanError(
                    f"{PARENT_NAMES[parent]}: części urlopu nie mogą się nakładać."
                )

    # Limit 82/86/130/134 tygodni (art. 182¹f) wynika z puli i pracy ≤ ½ etatu sprawdzonych
    # wyżej – osobna walidacja byłaby martwym kodem (test: cały urlop na ½ etatu = limit).
    limit = max_weeks_with_work(entitlement, params)
    return ParentalPlan(planned, entitlement, dict(weeks_by_parent), limit)


def calc_part_time(
    part: ParentalPart, entitlement: ParentalEntitlement, params: ParamSet
) -> PlannedPart:
    """Jedna część urlopu łączona z pracą (E.03–E.05, scenariusz T9)."""
    return calc_parental_split([part], entitlement, params).parts[0]
