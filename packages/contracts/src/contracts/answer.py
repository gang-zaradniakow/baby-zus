"""Karta odpowiedzi (§5, §5.1) – wspólny format odpowiedzi z poziomu 1 (silnik) i 2 (LLM)."""

from datetime import date
from decimal import Decimal
from typing import Self

from pydantic import Field, field_validator, model_validator

from contracts._base import ContractModel
from contracts.enums import ActionType, FactSource, GeneratedBy, PeriodType, Verdict
from contracts.types import EngineVersion, IntentId, LegalUrl, Money, NonEmptyStr, Rate

SUMMARY_MAX_LENGTH = 500
ACTION_LABEL_MAX_LENGTH = 40


class Fact(ContractModel):
    """Fakt, który zdecydował o wyniku (blok 3 „Dlaczego”)."""

    label: NonEmptyStr
    value: NonEmptyStr
    source: FactSource


class Period(ContractModel):
    """Okres świadczenia. ``amount`` to kwota za cały okres, ``monthly`` – miesięczna."""

    type: PeriodType
    date_from: date = Field(alias="from")
    date_to: date = Field(alias="to")
    rate: Rate
    amount: Money
    monthly: Money | None = None

    @model_validator(mode="after")
    def _dates_in_order(self) -> Self:
        if self.date_to < self.date_from:
            raise ValueError("okres: data 'to' jest wcześniejsza niż 'from'")
        return self


class Calculation(ContractModel):
    """Wynik kalkulatora (blok 4 „Wyliczenie i założenia”)."""

    base: Money
    rate: Rate
    periods: list[Period] = Field(default_factory=list)
    monthly: Money | None = None
    total: Money | None = None
    assumptions: list[NonEmptyStr] = Field(default_factory=list)

    @model_validator(mode="after")
    def _total_matches_periods(self) -> Self:
        if self.periods and self.total is not None:
            periods_sum = sum((p.amount for p in self.periods), Decimal(0))
            if periods_sum != self.total:
                raise ValueError(
                    f"total ({self.total}) różni się od sumy kwot okresów ({periods_sum})"
                )
        return self


class MissingField(ContractModel):
    """Brakujący fakt przy werdykcie NEED_INFO – staje się polem formularza."""

    field: NonEmptyStr
    question: NonEmptyStr


class LegalRef(ContractModel):
    """Podstawa prawna (blok 5) – zawsze z linkiem do zus.pl lub gov.pl."""

    act: NonEmptyStr
    article: NonEmptyStr
    url: LegalUrl


class Action(ContractModel):
    """Przycisk „Co dalej” (blok 6). ``ref`` wskazuje cel, np. formularz ``ZAM`` albo intencję."""

    type: ActionType
    label: NonEmptyStr = Field(max_length=ACTION_LABEL_MAX_LENGTH)
    ref: NonEmptyStr | None = None


class AnswerCard(ContractModel):
    """Odpowiedź asystenta w 6 blokach (§5). Ten sam format z silnika i z LLM."""

    intent_id: IntentId
    verdict: Verdict
    summary: NonEmptyStr = Field(max_length=SUMMARY_MAX_LENGTH)
    facts: list[Fact] = Field(default_factory=list)
    calculation: Calculation | None = None
    missing: list[MissingField] = Field(default_factory=list)
    legal_basis: list[LegalRef] = Field(min_length=1)
    actions: list[Action] = Field(min_length=1, max_length=3)
    engine_version: EngineVersion
    generated_by: GeneratedBy

    @field_validator("missing")
    @classmethod
    def _missing_fields_unique(cls, value: list[MissingField]) -> list[MissingField]:
        names = [m.field for m in value]
        if len(names) != len(set(names)):
            raise ValueError("missing: to samo pole podane więcej niż raz")
        return value

    @model_validator(mode="after")
    def _verdict_consistent(self) -> Self:
        if self.verdict is Verdict.NEED_INFO:
            if not self.missing:
                raise ValueError("NEED_INFO wymaga niepustej listy 'missing'")
            if self.calculation is not None:
                raise ValueError("NEED_INFO nie może zawierać wyliczenia – brakuje danych")
        elif self.missing:
            raise ValueError(f"'missing' musi być puste przy werdykcie {self.verdict}")
        return self
