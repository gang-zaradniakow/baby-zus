"""Bazowa klasa modeli i pomocnicze walidatory."""

from collections import Counter
from collections.abc import Hashable

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class ContractModel(BaseModel):
    """Baza wszystkich modeli kontraktu.

    - w Pythonie pola są w snake_case, w JSON w camelCase (``intent_id`` ↔ ``intentId``),
    - nieznane pola są odrzucane (ochrona przed „dopisaniem” czegoś przez LLM lub backend),
    - obiekty są niemutowalne (zmiana = ``model_copy(update=...)``).
    """

    model_config = ConfigDict(
        alias_generator=to_camel,
        validate_by_name=True,
        validate_by_alias=True,
        serialize_by_alias=True,
        extra="forbid",
        frozen=True,
        str_strip_whitespace=True,
        use_attribute_docstrings=True,  # docstringi pól trafiają do JSON Schema jako opisy
    )


def ensure_unique[T: Hashable](values: list[T], what: str) -> list[T]:
    """Zwraca listę bez zmian albo zgłasza błąd, jeśli zawiera powtórzenia."""
    duplicates = sorted(str(v) for v, count in Counter(values).items() if count > 1)
    if duplicates:
        raise ValueError(f"{what}: powtórzone wartości {duplicates}")
    return values
