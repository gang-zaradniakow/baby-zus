"""Formularz trybu bez logowania → ``Profile`` ze źródłem ``USER`` (ZUS-41).

Formularz ma te same pola co kontrakt ``Profile``, ale bez ``source`` i ``profileId`` –
ustawia je serwer, więc użytkownik nie może podać danych jako „pobranych z ZUS”.
Nieznane pola są odrzucane (422), tak jak w kontraktach.
"""

from datetime import date

from pydantic import Field

from contracts import (
    ChildInfo,
    FactSource,
    InsurancePeriod,
    InsuranceProfile,
    LeavePart,
    MonthlySalary,
    ParentProfile,
    ParentRole,
    PayerInfo,
    Placement,
    Profile,
    SickLeave,
    SpecialEvent,
)
from contracts._base import ContractModel
from contracts.profile import MAX_CHILDREN_PER_BIRTH
from contracts.types import Money, Rate

USER = FactSource.USER


class InsuranceForm(ContractModel):
    periods: list[InsurancePeriod] = Field(default_factory=list)
    payer: PayerInfo | None = None
    salaries: list[MonthlySalary] = Field(default_factory=list)
    deduction_rate: Rate | None = None
    contribution_debt: Money | None = None
    sick_leaves: list[SickLeave] = Field(default_factory=list)

    def to_contract(self) -> InsuranceProfile:
        return InsuranceProfile(source=USER, **self.model_dump(by_alias=False))


class ParentForm(ContractModel):
    role: ParentRole
    birth_date: date | None = None
    insurance: InsuranceForm = Field(default_factory=InsuranceForm)

    def to_contract(self) -> ParentProfile:
        return ParentProfile(
            role=self.role, birth_date=self.birth_date, insurance=self.insurance.to_contract()
        )


class ChildForm(ContractModel):
    expected_birth_date: date | None = None
    birth_date: date | None = None
    children_count: int = Field(default=1, ge=1, le=MAX_CHILDREN_PER_BIRTH)
    za_zyciem: bool = False
    gestational_weeks: int | None = Field(default=None, ge=20, le=45)
    birth_weight_g: int | None = Field(default=None, ge=200, le=7000)
    placement: Placement | None = None

    def to_contract(self) -> ChildInfo:
        return ChildInfo(source=USER, **self.model_dump(by_alias=False))


class ProfileForm(ContractModel):
    """Dane wpisane przez użytkownika; wszystkie fakty dostają źródło ``USER``."""

    applicant: ParentForm
    partner: ParentForm | None = None
    child: ChildForm
    special_events: list[SpecialEvent] = Field(default_factory=list)
    leave_plan: list[LeavePart] = Field(default_factory=list)

    def to_profile(self, profile_id: str) -> Profile:
        return Profile(
            profile_id=profile_id,
            applicant=self.applicant.to_contract(),
            partner=self.partner.to_contract() if self.partner else None,
            # Dane partnera z formularza są deklaracją użytkownika – zgoda dotyczy danych z ZUS.
            partner_consent=False,
            child=self.child.to_contract(),
            special_events=self.special_events,
            leave_plan=self.leave_plan,
        )


__all__ = ["ChildForm", "InsuranceForm", "ParentForm", "ProfileForm"]
