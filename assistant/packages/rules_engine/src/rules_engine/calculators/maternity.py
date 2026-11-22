"""Kalkulator zasiłku macierzyńskiego – warianty 81,5% oraz 100% + 70% (ZUS-16, B.01/B.04/B.06).

Zasady:
- kwota miesięczna = podstawa × stawka; zasiłek za dzień = 1/30 kwoty miesięcznej
  (zaokrąglony do grosza); kwota za okres = stawka dzienna × liczba dni,
- wariant jednolity 81,5% wymaga wniosku do 21 dni po porodzie (przyjęciu dziecka)
  i obejmuje urlop macierzyński + rodzicielski osoby wnioskującej,
- 9 tygodni urlopu rodzicielskiego drugiego rodzica zawsze jest płatne 70% – nie wchodzi
  do wyliczenia (to świadczenie drugiego rodzica),
- przy martwym urodzeniu i zgonie dziecka – tylko urlop macierzyński (100%).

Uproszczenie MVP: osoba wnioskująca wykorzystuje cały urlop rodzicielski poza tygodniami
drugiego rodzica, w jednej części, bezpośrednio po macierzyńskim (podział – ZUS-17).
"""

from dataclasses import dataclass
from datetime import date, timedelta
from decimal import Decimal
from enum import StrEnum
from typing import Final

from contracts import (
    Calculation,
    Fact,
    FactSource,
    Period,
    PeriodType,
    Profile,
    SpecialEventKind,
)
from rules_engine.calculators.contribution_base import ContributionBase, contribution_base
from rules_engine.calculators.leave_periods import (
    LeaveSpan,
    maternity_leave,
    parental_entitlement,
    parental_leave,
)
from rules_engine.formatting import format_date, format_percent, format_pln, money
from rules_engine.outcomes import NeedInfo, OutOfScope
from rules_engine.params import LegalBasis, ParamSet
from rules_engine.params.base import uz

DAYS_IN_BENEFIT_MONTH: Final = 30
BASIS_RATES: Final = (uz("art. 31"),)
EXPECTED_FIELD: Final = "child.expectedBirthDate"

ASSUMPTION_DAILY: Final = (
    "Zasiłek za każdy dzień to 1/30 kwoty miesięcznej (zaokrąglony do grosza)."
)
ASSUMPTION_SPLIT: Final = (
    "Cały urlop rodzicielski poza tygodniami drugiego rodzica wykorzystuje osoba "
    "wnioskująca – w jednej części, zaraz po urlopie macierzyńskim."
)
ASSUMPTION_CORRECTION: Final = (
    "Jeśli po wyborze 81,5% nie wykorzystasz urlopu rodzicielskiego, ZUS przeliczy "
    "zasiłek za urlop macierzyński – szczegóły ustala płatnik zasiłku."
)


class Variant(StrEnum):
    UNIFORM_815 = "UNIFORM_815"  # 81,5% za cały okres (wniosek do 21 dni)
    STANDARD_100_70 = "STANDARD_100_70"  # 100% za macierzyński, 70% za rodzicielski


VARIANT_NAMES: Final = {
    Variant.UNIFORM_815: "Wariant 81,5% za cały okres",
    Variant.STANDARD_100_70: "Wariant 100% + 70%",
}


@dataclass(frozen=True, slots=True)
class BenefitPeriod:
    type: PeriodType
    start: date
    end: date
    rate: Decimal
    monthly: Decimal
    daily: Decimal

    @property
    def days(self) -> int:
        return (self.end - self.start).days + 1

    @property
    def amount(self) -> Decimal:
        return money(self.daily * self.days)

    def to_contract(self) -> Period:
        return Period(
            type=self.type,
            date_from=self.start,
            date_to=self.end,
            rate=self.rate,
            amount=self.amount,
            monthly=self.monthly,
        )


def benefit_period(span: LeaveSpan, base: Decimal, rate: Decimal) -> BenefitPeriod:
    monthly = money(base * rate)
    daily = money(base * rate / DAYS_IN_BENEFIT_MONTH)
    return BenefitPeriod(span.type, span.start, span.end, rate, monthly, daily)


@dataclass(frozen=True, slots=True)
class VariantResult:
    variant: Variant
    periods: tuple[BenefitPeriod, ...]
    available: bool
    reason_unavailable: str | None = None

    @property
    def total(self) -> Decimal:
        return sum((p.amount for p in self.periods), Decimal(0))

    @property
    def weeks(self) -> int:
        return sum(p.days for p in self.periods) // 7

    def describe(self) -> str:
        parts = ", ".join(
            f"{format_pln(p.monthly)}/mies. ({format_percent(p.rate)}) przez {p.days // 7} tyg."
            for p in self.periods
        )
        text = f"{parts}; łącznie {format_pln(self.total)}"
        return text if self.available else f"{text} – {self.reason_unavailable}"

    def to_calculation(self, base: Decimal, assumptions: tuple[str, ...]) -> Calculation:
        first = self.periods[0]
        return Calculation(
            base=base,
            rate=first.rate,
            periods=[p.to_contract() for p in self.periods],
            monthly=first.monthly,
            total=self.total,
            assumptions=list(assumptions),
        )


@dataclass(frozen=True, slots=True)
class MaternityCalculation:
    base: Decimal
    base_details: ContributionBase | None
    uniform: VariantResult
    standard: VariantResult
    event_date: date
    event_happened: bool
    application_deadline: date
    days_left: int | None
    """Dni na wniosek o 81,5% (``None`` – zdarzenie jeszcze nie nastąpiło)."""
    assumptions: tuple[str, ...]
    legal_basis: tuple[LegalBasis, ...]
    child_source: FactSource
    """Źródło danych o dziecku (data porodu) – dla faktów wyliczonych z tej daty."""

    @property
    def recommended(self) -> VariantResult:
        """Wariant do bloku „Wyliczenie” – jednolity, jeśli dostępny."""
        return self.uniform if self.uniform.available else self.standard

    def facts(self) -> list[Fact]:
        """Fakty do bloku „Dlaczego”: podstawa, termin wniosku (bez przypomnień – U9), warianty."""
        facts: list[Fact] = list(self.base_details.facts()) if self.base_details else []
        if self.days_left is None:
            deadline_text = "do 21 dni po porodzie (lub przyjęciu dziecka)"
        elif self.days_left >= 0:
            deadline_text = (
                f"do {format_date(self.application_deadline)} (pozostało {self.days_left} dni)"
            )
        else:
            deadline_text = f"termin minął {format_date(self.application_deadline)}"
        facts.append(
            Fact(
                label="Termin wniosku o wariant 81,5%",
                value=deadline_text,
                source=self.child_source,
            )
        )
        facts.extend(
            Fact(
                label=VARIANT_NAMES[result.variant],
                value=result.describe(),
                source=self.child_source,
            )
            for result in (self.uniform, self.standard)
        )
        return facts


def _anchor(profile: Profile) -> tuple[date, bool] | None:
    child = profile.child
    if child.placement is not None:
        return child.placement.placement_date, True
    if child.birth_date is not None:
        return child.birth_date, True
    if child.expected_birth_date is not None:
        return child.expected_birth_date, False
    return None


def calc_maternity(
    profile: Profile,
    params: ParamSet,
    today: date,
    *,
    base: Decimal | None = None,
    application_date: date | None = None,
) -> MaternityCalculation | NeedInfo | OutOfScope:
    """Zasiłek macierzyński w obu wariantach.

    ``base`` – gotowa podstawa (np. z Z-3); bez niej liczymy ją z przychodów (ZUS-12).
    ``application_date`` – data złożenia wniosku; bez niej dostępność 81,5% oceniamy na dziś.
    """
    anchor_info = _anchor(profile)
    if anchor_info is None:
        return NeedInfo(
            (EXPECTED_FIELD,), "Potrzebna przewidywana data porodu albo data urodzenia."
        )
    anchor, happened = anchor_info

    base_details: ContributionBase | None = None
    if base is None:
        outcome = contribution_base(profile.applicant.insurance, anchor, params)
        if not isinstance(outcome, ContributionBase):
            return outcome
        base_details, base = outcome, outcome.amount

    assumptions: list[str] = [ASSUMPTION_DAILY]
    if base_details:
        assumptions.extend(base_details.assumptions)

    events = {e.kind: e.date_from for e in profile.special_events}
    children = profile.child.children_count
    loss = SpecialEventKind.STILLBIRTH in events or SpecialEventKind.MISCARRIAGE in events
    death = events.get(SpecialEventKind.CHILD_DEATH)

    deadline = anchor + timedelta(days=params.uniform_rate_application_days.value)
    reference = application_date or today
    days_left = (deadline - today).days if happened else None

    rate_full = params.rate_maternity.value
    if loss or death is not None:
        span = maternity_leave(anchor, children, params, stillbirth=loss, child_death=death)
        standard = VariantResult(
            Variant.STANDARD_100_70, (benefit_period(span, base, rate_full),), available=True
        )
        uniform = VariantResult(
            Variant.UNIFORM_815,
            (benefit_period(span, base, params.rate_uniform.value),),
            available=False,
            reason_unavailable="nie dotyczy – przysługuje tylko zasiłek za urlop macierzyński",
        )
        legal = span.legal_basis + BASIS_RATES
    else:
        maternity = maternity_leave(anchor, children, params)
        entitlement = parental_entitlement(
            anchor, children, params, za_zyciem=profile.child.za_zyciem
        )
        parental = parental_leave(maternity.next_day, entitlement.max_weeks_one_parent, entitlement)
        uniform_rate = params.rate_uniform.value
        too_late = happened and reference > deadline
        uniform = VariantResult(
            Variant.UNIFORM_815,
            (
                benefit_period(maternity, base, uniform_rate),
                benefit_period(parental, base, uniform_rate),
            ),
            available=not too_late,
            reason_unavailable=f"niedostępny: wniosek trzeba było złożyć do {format_date(deadline)}"
            if too_late
            else None,
        )
        standard = VariantResult(
            Variant.STANDARD_100_70,
            (
                benefit_period(maternity, base, rate_full),
                benefit_period(parental, base, params.rate_parental.value),
            ),
            available=True,
        )
        assumptions.extend([ASSUMPTION_SPLIT, ASSUMPTION_CORRECTION])
        legal = maternity.legal_basis + parental.legal_basis + BASIS_RATES

    if base_details:
        legal = legal + base_details.legal_basis
    return MaternityCalculation(
        base=base,
        base_details=base_details,
        uniform=uniform,
        standard=standard,
        event_date=anchor,
        event_happened=happened,
        application_deadline=deadline,
        days_left=days_left,
        assumptions=tuple(assumptions),
        legal_basis=legal,
        child_source=profile.child.source,
    )
