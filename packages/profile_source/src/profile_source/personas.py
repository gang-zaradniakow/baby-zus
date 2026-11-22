"""Persony testowe T1–T12 (ZUS-20 w wersji okrojonej + ZUS-31).

Jedna persona = jeden plik JSON w ``data/personas/``:

- ``profile`` – profil w formacie kontraktu ``Profile`` (tak jak przyjdzie z backendu),
- ``expected`` – oczekiwane wyniki silnika dla wybranych intencji (sprawa „golden”),
- ``source`` – skąd są oczekiwane wartości: wyliczenie ręczne albo sprawa ZUS (plik, strona).

Ten sam plik czyta mock ``ProfileSource`` (dane profilu) i test golden (oczekiwania), więc
persony nie rozjadą się między warstwami. Gdy przyjdą sprawy ZUS w PDF, osoba weryfikująca
podmienia ``expected`` i ustawia ``source.kind = ZUS_CASE`` z numerem strony – bez parsera.
"""

import json
from datetime import date
from enum import StrEnum
from pathlib import Path
from typing import Self

from pydantic import Field, model_validator

from contracts import Flag, PeriodType, Profile, Stage, Verdict
from contracts._base import ContractModel
from contracts.types import IntentId, Money, NonEmptyStr, Rate

PERSONA_ID_PATTERN = r"^T\d{2}$"


class SourceKind(StrEnum):
    MANUAL = "MANUAL"
    """Wyliczenie ręczne – wersja tymczasowa do czasu otrzymania sprawy ZUS."""
    ZUS_CASE = "ZUS_CASE"
    """Rozstrzygnięcie ze sprawy ZUS (PDF poza repozytorium)."""


class Scope(StrEnum):
    ENGINE = "ENGINE"
    """Wynik daje silnik reguł – sprawdza test golden."""
    LEVEL2 = "LEVEL2"
    """Scenariusz poziomu 2 (LLM, RAG, dokumenty) – sprawdzają testy asystenta."""


class CaseSource(ContractModel):
    kind: SourceKind
    document: NonEmptyStr | None = None
    page: int | None = Field(default=None, ge=1)
    note: NonEmptyStr

    @model_validator(mode="after")
    def _zus_case_points_to_page(self) -> Self:
        if self.kind is SourceKind.ZUS_CASE and (self.document is None or self.page is None):
            raise ValueError("sprawa ZUS wymaga nazwy dokumentu i numeru strony")
        return self

    def describe(self) -> str:
        if self.kind is SourceKind.ZUS_CASE:
            return f"{self.document}, str. {self.page}"
        return f"wyliczenie ręczne: {self.note}"


class ExpectedPeriod(ContractModel):
    type: PeriodType
    date_from: date = Field(alias="from")
    date_to: date = Field(alias="to")
    rate: Rate | None = None
    amount: Money | None = None


class ExpectedCalculation(ContractModel):
    """Pola ``None`` nie są sprawdzane – golden porównuje tylko to, co podano."""

    base: Money | None = None
    rate: Rate | None = None
    monthly: Money | None = None
    total: Money | None = None
    periods: list[ExpectedPeriod] | None = None


class ExpectedAnswer(ContractModel):
    intent_id: IntentId
    verdict: Verdict | None = None
    unsupported: bool = False
    """Silnik nie ma reguły – oczekujemy ``Unsupported`` (poziom 2 / urzędnik), nie werdyktu."""
    missing: list[NonEmptyStr] | None = None
    summary_contains: list[NonEmptyStr] = Field(default_factory=list)
    warnings_contain: list[NonEmptyStr] = Field(default_factory=list)
    calculation: ExpectedCalculation | None = None

    @model_validator(mode="after")
    def _verdict_or_unsupported(self) -> Self:
        if self.unsupported == (self.verdict is not None):
            raise ValueError(f"{self.intent_id}: podaj albo 'verdict', albo 'unsupported': true")
        if self.missing is not None and self.verdict is not Verdict.NEED_INFO:
            raise ValueError(f"{self.intent_id}: 'missing' tylko przy NEED_INFO")
        return self


class ExpectedStage(ContractModel):
    stage: Stage | None
    flags: list[Flag] = Field(default_factory=list)


class Level2Expectation(ContractModel):
    """Scenariusz dla asystenta (T11, T12): pytanie, ewentualny tekst z dokumentu, zachowanie."""

    question: NonEmptyStr
    untrusted_text: NonEmptyStr | None = None
    expected_behavior: NonEmptyStr


class Persona(ContractModel):
    id: str = Field(pattern=PERSONA_ID_PATTERN)
    title: NonEmptyStr
    scenario: NonEmptyStr
    """Opis scenariusza z §10.1 dokumentu założeń."""
    scope: Scope
    source: CaseSource
    today: date
    """Dzień „dziś” dla wyliczeń – sprawy są powtarzalne niezależnie od daty uruchomienia."""
    profile: Profile
    stage: ExpectedStage | None = None
    expected: list[ExpectedAnswer] = Field(default_factory=list)
    level2: Level2Expectation | None = None

    @model_validator(mode="after")
    def _scope_consistent(self) -> Self:
        if self.scope is Scope.ENGINE and not self.expected:
            raise ValueError(f"{self.id}: persona silnika wymaga sekcji 'expected'")
        if self.scope is Scope.LEVEL2 and self.level2 is None:
            raise ValueError(f"{self.id}: persona poziomu 2 wymaga sekcji 'level2'")
        intents = [e.intent_id for e in self.expected]
        if len(intents) != len(set(intents)):
            raise ValueError(f"{self.id}: ta sama intencja w 'expected' więcej niż raz")
        return self


def load_persona(path: Path) -> Persona:
    persona = Persona.model_validate(json.loads(path.read_text(encoding="utf-8")))
    if not path.stem.startswith(f"{persona.id}_"):
        raise ValueError(f"{path.name}: nazwa pliku musi zaczynać się od '{persona.id}_'")
    return persona


def load_personas(directory: Path) -> list[Persona]:
    """Wszystkie persony z katalogu, posortowane po identyfikatorze."""
    personas = sorted((load_persona(p) for p in directory.glob("T*.json")), key=lambda p: p.id)
    ids = [p.id for p in personas]
    if len(ids) != len(set(ids)):
        raise ValueError(f"powtórzone identyfikatory person w {directory}")
    return personas
