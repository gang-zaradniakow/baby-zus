"""Wynik reguły uprawnień – surowiec dla karty odpowiedzi (ZUS-19)."""

from dataclasses import dataclass, field
from datetime import date

from contracts import Fact, Verdict
from rules_engine.params import LegalBasis


@dataclass(frozen=True, slots=True)
class Decision:
    verdict: Verdict
    summary: str
    """1–2 zdania szablonowe (LLM może je potem przeredagować, liczb nie zmienia)."""
    facts: tuple[Fact, ...] = ()
    legal_basis: tuple[LegalBasis, ...] = ()
    missing: tuple[str, ...] = ()
    """Ścieżki brakujących pól (tylko NEED_INFO)."""
    warnings: tuple[str, ...] = ()
    """Ryzyka i ostrzeżenia – nie zmieniają werdyktu (kategoria H)."""
    alternatives: tuple[str, ...] = ()
    """Co zamiast – przy werdykcie NO."""
    assumptions: tuple[str, ...] = ()
    period: tuple[date, date] | None = field(default=None)
    """Okres prawa do świadczenia, jeśli wynika z reguły (np. do dnia porodu)."""

    def __post_init__(self) -> None:
        if (self.verdict is Verdict.NEED_INFO) != bool(self.missing):
            raise ValueError("NEED_INFO wymaga listy braków, a inne werdykty – jej braku")
        if not self.legal_basis:
            raise ValueError("decyzja bez podstawy prawnej")
