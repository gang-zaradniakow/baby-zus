"""Pseudonimizacja przed każdym wywołaniem zewnętrznego modelu (§9.1, ZUS-54, TL-34…TL-36).

Identyfikatory i dane kontaktowe z tekstu użytkownika zamieniamy na znaczniki
(``[PESEL_1]``, ``[EMAIL_1]``…) i zapamiętujemy mapę – odpowiedź modelu można odtworzyć,
a sam model nigdy nie widzi oryginału. ``PrivateLLMClient`` robi to dla KAŻDEGO wywołania
(także podsumowań i ponowień), więc pominięcie maskowania w kodzie wywołującym nie ujawni danych.

Rozpoznawane: PESEL (11 cyfr), NIP, numer rachunku (26 cyfr, opcjonalnie „PL”), telefon,
e-mail, adres (ulica z numerem, kod pocztowy), imię i nazwisko po „nazywam się / mam na imię”.
Daty i kwoty zostają – są potrzebne do rozpoznania pytania i nie wskazują osoby same w sobie.
"""

import re
from collections.abc import Callable
from dataclasses import dataclass, field
from typing import Any, Final

from pydantic import BaseModel

from assistant.llm.base import Capabilities, Completion, LLMClient, Message

UPPER: Final = "A-ZĄĆĘŁŃÓŚŹŻ"
LOWER: Final = "a-ząćęłńóśźż"
NAME: Final = rf"[{UPPER}][{LOWER}]+(?:-[{UPPER}][{LOWER}]+)?"

#: (rodzaj, wzorzec) – kolejność ma znaczenie: dłuższe numery przed krótszymi.
PATTERNS: Final[tuple[tuple[str, re.Pattern[str]], ...]] = (
    ("EMAIL", re.compile(r"[\w.+-]+@[\w-]+(?:\.[\w-]+)+")),
    ("KONTO", re.compile(r"\b(?:PL)?\d{2}(?:[ ]?\d{4}){6}\b")),
    ("PESEL", re.compile(r"(?<!\d)\d{11}(?!\d)")),
    (
        "NIP",
        re.compile(
            r"(?<!\d)(?:\d{3}-\d{3}-\d{2}-\d{2}|\d{3}-\d{2}-\d{2}-\d{3})(?!\d)"
            r"|(?i:NIP)[:\s]*\d{10}(?!\d)"
        ),
    ),
    # Telefon, ale nie kwota („600 700 800 zł”) ani część liczby dziesiętnej.
    (
        "TELEFON",
        re.compile(r"(?:\+48[ -]?)?(?<!\d)\d{3}[ -]\d{3}[ -]\d{3}(?!\d|[.,]\d|\s*(?:zł|PLN))"),
    ),
    (
        "ADRES",
        re.compile(
            rf"\b(?:ul\.|ulica|al\.|aleja|os\.|osiedle|pl\.|plac)\s+{NAME}(?:\s+{NAME})*"
            r"\s+\d+[a-zA-Z]?(?:\s*/\s*\d+)?"
        ),
    ),
    ("KOD", re.compile(r"(?<![\d-])\d{2}-\d{3}(?![\d-])")),
    (
        "OSOBA",
        re.compile(rf"(?i:nazywam się|mam na imię|imię i nazwisko:?)\s+(?-i:{NAME}(?:\s+{NAME})?)"),
    ),
)
PLACEHOLDER_RE: Final = re.compile(r"\[(?:EMAIL|KONTO|PESEL|NIP|TELEFON|ADRES|KOD|OSOBA)_\d+\]")


@dataclass
class Pseudonymizer:
    """Jedna instancja na rozmowę – ta sama wartość dostaje zawsze ten sam znacznik."""

    mapping: dict[str, str] = field(default_factory=dict)
    """Znacznik → oryginał (do odtworzenia odpowiedzi; nie trafia do logów ani modelu)."""
    _by_value: dict[str, str] = field(default_factory=dict)

    def mask(self, text: str) -> str:
        for kind, pattern in PATTERNS:
            text = pattern.sub(self._replacer(kind), text)
        return text

    def _replacer(self, kind: str) -> Callable[[re.Match[str]], str]:
        def replace(match: re.Match[str]) -> str:
            return self._placeholder(kind, match.group(0))

        return replace

    def _placeholder(self, kind: str, value: str) -> str:
        if value not in self._by_value:
            count = sum(1 for p in self.mapping if p.startswith(f"[{kind}_")) + 1
            placeholder = f"[{kind}_{count}]"
            self._by_value[value] = placeholder
            self.mapping[placeholder] = value
        return self._by_value[value]

    def restore(self, text: str) -> str:
        return PLACEHOLDER_RE.sub(lambda m: self.mapping.get(m.group(0), m.group(0)), text)

    def restore_data(self, data: Any) -> Any:
        if isinstance(data, str):
            return self.restore(data)
        if isinstance(data, list):
            return [self.restore_data(item) for item in data]
        if isinstance(data, dict):
            return {key: self.restore_data(value) for key, value in data.items()}
        return data


def contains_personal_data(text: str) -> bool:
    """Czy tekst zawiera coś, co pseudonimizacja by zamaskowała (do testów i asercji)."""
    return any(pattern.search(text) for _, pattern in PATTERNS)


class PrivateLLMClient:
    """``LLMClient``, który maskuje każdą wiadomość przed wysłaniem i odtwarza odpowiedź."""

    def __init__(self, inner: LLMClient) -> None:
        self._inner = inner

    @property
    def capabilities(self) -> Capabilities:
        return self._inner.capabilities

    async def complete(
        self, messages: list[Message], *, max_tokens: int | None = None
    ) -> Completion:
        privacy = Pseudonymizer()
        masked = [Message(m.role, privacy.mask(m.content)) for m in messages]
        completion = await self._inner.complete(masked, max_tokens=max_tokens)
        return Completion(
            text=privacy.restore(completion.text),
            model=completion.model,
            usage=completion.usage,
            latency_s=completion.latency_s,
        )

    async def complete_json[M: BaseModel](
        self, messages: list[Message], schema: type[M], *, max_tokens: int | None = None
    ) -> M:
        privacy = Pseudonymizer()
        masked = [Message(m.role, privacy.mask(m.content)) for m in messages]
        result = await self._inner.complete_json(masked, schema, max_tokens=max_tokens)
        return schema.model_validate(privacy.restore_data(result.model_dump()))

    async def aclose(self) -> None:
        await self._inner.aclose()
