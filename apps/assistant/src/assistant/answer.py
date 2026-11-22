"""Odpowiedź poziomu 2 (czat) – to, co API zwraca na ``POST /chat`` (ZUS-43).

``kind``:
- ``CARD`` – karta z silnika (``card``), tekst ``summary`` napisany przez LLM i sprawdzony
  przez walidator albo szablon silnika (``generatedBy`` mówi które),
- ``KNOWLEDGE`` – pytanie spoza katalogu: odpowiedź z bazy wiedzy, zawsze ze źródłami,
- ``ESCALATE`` – asystent nie odpowie rzetelnie; proponuje kontakt z urzędnikiem (§8.1),
- ``REFUSAL`` – guardrails (§9.2): porada medyczna, „optymalizacja”, temat spoza zakresu.
"""

from typing import Literal

from pydantic import Field, HttpUrl

from contracts import Action, AnswerCard, GeneratedBy, LegalRef
from contracts._base import ContractModel


class Source(ContractModel):
    """Źródło z bazy wiedzy – tytuł i adres (cytujemy tylko to, co ma źródło)."""

    title: str
    url: HttpUrl
    excerpt: str
    act: str | None = None
    article: str | None = None


class SupportOrgRef(ContractModel):
    """Organizacja wsparcia (ścieżka „sytuacja trudna”, §9.3)."""

    name: str
    description: str
    url: HttpUrl | None = None


class ChatAnswer(ContractModel):
    kind: Literal["CARD", "KNOWLEDGE", "ESCALATE", "REFUSAL"]
    intent_id: str
    """Intencja z katalogu albo ``OUT_OF_CATALOG``."""
    message: str = Field(max_length=1500)
    """Tekst dla użytkownika (przy CARD – ``card.summary``)."""
    card: AnswerCard | None = None
    sources: list[Source] = Field(default_factory=list)
    legal_basis: list[LegalRef] = Field(default_factory=list)
    """Podstawa prawna odpowiedzi z bazy wiedzy (przy CARD – w ``card.legalBasis``)."""
    generated_by: GeneratedBy = GeneratedBy.RULES
    """Czy tekst ``message`` napisał model (oznaczenie AI wg AI Act)."""
    actions: list[Action] = Field(default_factory=list)
    escalation_reason: str | None = None
    level1_intent_id: str | None = None
    """Ta sama odpowiedź na liście pytań (poziom 1) – do linku „pokaż pełną kartę”."""
    suggestions: list[str] = Field(default_factory=list)
    """Podobne pytania z katalogu, gdy pytanie nie zostało rozpoznane."""
    difficult: bool = False
    """Sytuacja trudna (§9.3) – interfejs bez liczników i grafik, ciepły ton."""
    support_orgs: list[SupportOrgRef] = Field(default_factory=list)
