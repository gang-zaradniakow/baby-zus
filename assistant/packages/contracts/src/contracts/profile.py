"""Profil użytkownika (§3.3): dane ubezpieczenia obojga rodziców, dziecko, zdarzenia, plan urlopu.

Profil może być niekompletny – brak danych to nie błąd walidacji, tylko podstawa
do werdyktu NEED_INFO w silniku. Kontrakt odrzuca wyłącznie dane sprzeczne.
"""

from datetime import date
from decimal import Decimal
from typing import Self

from pydantic import Field, field_validator, model_validator

from contracts._base import ContractModel, ensure_unique
from contracts.enums import (
    EmploymentEndReason,
    FactSource,
    Flag,
    InsuranceTitle,
    ParentRole,
    PeriodType,
    PlacementKind,
    SicknessInsurance,
    SpecialEventKind,
    Stage,
)
from contracts.types import Fraction, Money, NonEmptyStr, Rate, SickLeaveCode, YearMonth

MAX_CHILDREN_PER_BIRTH = 10


def _check_range(date_from: date, date_to: date | None, what: str) -> None:
    if date_to is not None and date_to < date_from:
        raise ValueError(f"{what}: data końca jest wcześniejsza niż data początku")


class InsurancePeriod(ContractModel):
    """Okres podlegania ubezpieczeniu z jednego tytułu."""

    title: InsuranceTitle
    sickness: SicknessInsurance
    date_from: date
    date_to: date | None = None
    end_reason: EmploymentEndReason | None = None

    @model_validator(mode="after")
    def _consistent(self) -> Self:
        _check_range(self.date_from, self.date_to, "okres ubezpieczenia")
        if self.end_reason is not None and self.date_to is None:
            raise ValueError("przyczyna ustania wymaga daty końca okresu ('dateTo')")
        return self


class PayerInfo(ContractModel):
    """Liczba ubezpieczonych u płatnika – decyduje, kto wypłaca zasiłek (art. 61)."""

    insured_count_nov30: int = Field(ge=0)
    count_date: date

    @field_validator("count_date")
    @classmethod
    def _is_30_november(cls, value: date) -> date:
        if (value.month, value.day) != (11, 30):
            raise ValueError("liczbę ubezpieczonych podaje się według stanu na 30 listopada")
        return value


class MonthlySalary(ContractModel):
    """Przychód brutto za miesiąc (podstawa wymiaru liczona w silniku, ZUS-12)."""

    month: YearMonth
    gross: Money


class SickLeave(ContractModel):
    """Zwolnienie lekarskie e-ZLA."""

    date_from: date
    date_to: date
    code: SickLeaveCode | None = None

    @model_validator(mode="after")
    def _dates_in_order(self) -> Self:
        _check_range(self.date_from, self.date_to, "e-ZLA")
        return self


class InsuranceProfile(ContractModel):
    """Dane ubezpieczeniowe jednego rodzica (pobrane z ZUS albo wpisane w formularzu)."""

    source: FactSource
    periods: list[InsurancePeriod] = Field(default_factory=list)
    payer: PayerInfo | None = None
    salaries: list[MonthlySalary] = Field(default_factory=list)
    deduction_rate: Rate | None = None
    """Procent potrąconych składek ze sprawy (U7); brak → wartość domyślna z parametrów."""
    contribution_debt: Money | None = None
    sick_leaves: list[SickLeave] = Field(default_factory=list)

    @field_validator("salaries")
    @classmethod
    def _months_unique(cls, value: list[MonthlySalary]) -> list[MonthlySalary]:
        ensure_unique([s.month for s in value], "salaries.month")
        return value


class ParentProfile(ContractModel):
    role: ParentRole
    birth_date: date | None = None
    """Potrzebna tylko do progu 50 lat (wynagrodzenie chorobowe 14 zamiast 33 dni)."""
    insurance: InsuranceProfile


class Placement(ContractModel):
    """Przyjęcie dziecka na wychowanie: przysposobienie albo rodzina zastępcza (E4 → flaga)."""

    kind: PlacementKind
    child_birth_date: date
    placement_date: date
    ruling_final_date: date | None = None
    school_deferral: bool = False

    @model_validator(mode="after")
    def _consistent(self) -> Self:
        _check_range(self.child_birth_date, self.placement_date, "przyjęcie dziecka")
        return self


class ChildInfo(ContractModel):
    """Dane ciąży lub dziecka. Wszystkie daty opcjonalne – brak oznacza NEED_INFO."""

    source: FactSource
    expected_birth_date: date | None = None
    birth_date: date | None = None
    children_count: int = Field(default=1, ge=1, le=MAX_CHILDREN_PER_BIRTH)
    za_zyciem: bool = False
    gestational_weeks: int | None = Field(default=None, ge=20, le=45)
    """Ukończone tygodnie ciąży w dniu porodu (urlop uzupełniający, ZUS-18)."""
    birth_weight_g: int | None = Field(default=None, ge=200, le=7000)
    """Masa urodzeniowa w gramach; przy porodzie mnogim – najmniejsza z mas dzieci."""
    placement: Placement | None = None


class SpecialEvent(ContractModel):
    """Zdarzenie szczególne (§3.1 E5, kategoria F): hospitalizacja, zgon, wcześniak itp."""

    kind: SpecialEventKind
    date_from: date
    date_to: date | None = None

    @model_validator(mode="after")
    def _dates_in_order(self) -> Self:
        _check_range(self.date_from, self.date_to, f"zdarzenie {self.kind}")
        return self


class LeavePart(ContractModel):
    """Część planowanego urlopu (podział między rodziców, łączenie z pracą)."""

    parent: ParentRole
    type: PeriodType
    date_from: date
    date_to: date
    work_fraction: Fraction = Decimal(0)
    """Wymiar pracy w trakcie tej części urlopu (0 = bez pracy, maks. 0.5 sprawdza silnik)."""

    @model_validator(mode="after")
    def _dates_in_order(self) -> Self:
        _check_range(self.date_from, self.date_to, "część urlopu")
        return self


class Profile(ContractModel):
    """Kompletny kontekst sprawy przekazywany do silnika reguł."""

    profile_id: NonEmptyStr
    """Pseudonimowy identyfikator – nigdy PESEL."""
    applicant: ParentProfile
    partner: ParentProfile | None = None
    partner_consent: bool = False
    child: ChildInfo
    special_events: list[SpecialEvent] = Field(default_factory=list)
    leave_plan: list[LeavePart] = Field(default_factory=list)

    @model_validator(mode="after")
    def _partner_data_requires_consent(self) -> Self:
        # §7: dane drugiego rodzica z ZUS tylko za jego zgodą; inaczej wyłącznie deklarowane.
        if (
            self.partner is not None
            and self.partner.insurance.source is not FactSource.USER
            and not self.partner_consent
        ):
            raise ValueError(
                "dane drugiego rodzica spoza formularza wymagają jego zgody (partnerConsent)"
            )
        return self


class StageInfo(ContractModel):
    """Etap i flagi wyliczone dla dziecka. ``stage = None`` – za mało danych, by go ustalić."""

    stage: Stage | None
    flags: list[Flag] = Field(default_factory=list)

    @field_validator("flags")
    @classmethod
    def _flags_unique(cls, value: list[Flag]) -> list[Flag]:
        return ensure_unique(value, "flags")
