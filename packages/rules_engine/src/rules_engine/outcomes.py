"""Wspólne wyniki „nie da się policzyć” dla kalkulatorów i reguł silnika.

- ``NeedInfo`` – brakuje danych, które użytkownik albo ZUS może uzupełnić (werdykt NEED_INFO),
- ``OutOfScope`` – przypadek poza zakresem silnika; zamiast zgadywać, proponujemy eskalację.
"""

from dataclasses import dataclass

from rules_engine.params import LegalBasis


@dataclass(frozen=True, slots=True)
class NeedInfo:
    missing: tuple[str, ...]
    """Ścieżki pól profilu (klucze ``catalog.FIELD_QUESTIONS``)."""
    reason: str

    def __post_init__(self) -> None:
        if not self.missing:
            raise ValueError("NeedInfo wymaga co najmniej jednego brakującego pola")


@dataclass(frozen=True, slots=True)
class OutOfScope:
    reason: str
    legal_basis: tuple[LegalBasis, ...] = ()
