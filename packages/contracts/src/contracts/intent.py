"""Intencja z katalogu pytań A–H (§4)."""

from typing import Self

from pydantic import Field, field_validator, model_validator

from contracts._base import ContractModel, ensure_unique
from contracts.enums import AnswerType, Category, Flag, Stage
from contracts.types import OUT_OF_CATALOG, IntentId, NonEmptyStr


class Intent(ContractModel):
    """Pytanie z katalogu: typ odpowiedzi, etapy/flagi, na których się pokazuje, wymagane dane."""

    id: IntentId
    category: Category
    question: NonEmptyStr
    answer_types: list[AnswerType] = Field(min_length=1)
    stages: list[Stage] = Field(default_factory=list)
    flags: list[Flag] = Field(default_factory=list)
    required_fields: list[NonEmptyStr] = Field(default_factory=list)
    priority: int = Field(default=100, ge=0)
    """Kolejność na liście – mniejsza liczba wyżej."""

    @field_validator("answer_types", "stages", "flags", "required_fields")
    @classmethod
    def _unique(cls, value: list[str]) -> list[str]:
        return ensure_unique(value, "lista")

    @model_validator(mode="after")
    def _consistent(self) -> Self:
        if self.id == OUT_OF_CATALOG:
            raise ValueError("OUT_OF_CATALOG nie jest intencją katalogu")
        if self.id[0] != self.category.value:
            raise ValueError(f"id {self.id} nie pasuje do kategorii {self.category.value}")
        if not self.stages and not self.flags:
            raise ValueError("intencja musi mieć co najmniej jeden etap albo flagę")
        return self
