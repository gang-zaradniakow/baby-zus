"""Interfejsy ``LLMClient`` i ``EmbeddingClient`` (U6: model wymienny konfiguracją).

Reszta asystenta zna tylko te porty – zmiana dostawcy lub modelu to zmiana zmiennych
``LLM_*`` / ``EMBEDDING_*``, nie kodu. Wyjątki nie zawierają treści promptu (dane osobowe).
"""

from dataclasses import dataclass, field
from typing import Literal, Protocol

from pydantic import BaseModel

Role = Literal["system", "user", "assistant"]


@dataclass(frozen=True, slots=True)
class Message:
    role: Role
    content: str


@dataclass(frozen=True, slots=True)
class Capabilities:
    json_schema: bool
    """Serwer wymusza JSON zgodny ze schematem (``response_format=json_schema``)."""
    reasoning_effort: str | None = None
    """Poziom rozumowania wysyłany do modelu (``None`` – domyślny serwera)."""
    context_tokens: int | None = None


@dataclass(frozen=True, slots=True)
class Usage:
    prompt_tokens: int | None = None
    completion_tokens: int | None = None
    reasoning_tokens: int | None = None


@dataclass(frozen=True, slots=True)
class Completion:
    text: str
    """Odpowiedź bez bloku rozumowania (``<think>…</think>``)."""
    model: str
    usage: Usage = field(default_factory=Usage)
    latency_s: float = 0.0


class LLMError(Exception):
    """Baza błędów klienta LLM."""


class LLMUnavailableError(LLMError):
    """Model nie odpowiedział (timeout, 429, 5xx) mimo ponowień – orkiestrator używa szablonu."""

    def __init__(self, message: str, attempts: int) -> None:
        super().__init__(f"{message} (prób: {attempts})")
        self.attempts = attempts


class LLMRequestError(LLMError):
    """Żądanie odrzucone (400, 401, 403, 404…) – ponawianie nic nie da (zła konfiguracja)."""

    def __init__(self, status_code: int) -> None:
        super().__init__(f"dostawca LLM odrzucił żądanie: HTTP {status_code}")
        self.status_code = status_code


class LLMInvalidOutputError(LLMError):
    """Model nie zwrócił poprawnego JSON-a zgodnego ze schematem mimo ponowień."""

    def __init__(self, schema: str, attempts: int, errors: list[str]) -> None:
        super().__init__(f"niepoprawna odpowiedź dla {schema} (prób: {attempts})")
        self.attempts = attempts
        self.errors = errors


class LLMConfigurationError(LLMError, ValueError):
    """Zła konfiguracja ``LLM_*`` / ``EMBEDDING_*`` – zgłaszana przy starcie."""


class LLMClient(Protocol):
    @property
    def capabilities(self) -> Capabilities: ...

    async def complete(
        self, messages: list[Message], *, max_tokens: int | None = None
    ) -> Completion: ...

    async def complete_json[M: BaseModel](
        self, messages: list[Message], schema: type[M], *, max_tokens: int | None = None
    ) -> M: ...

    async def aclose(self) -> None: ...


class EmbeddingClient(Protocol):
    @property
    def dimension(self) -> int | None:
        """Wymiar wektora (``None`` – nieznany przed pierwszym wywołaniem)."""
        ...

    async def embed(self, texts: list[str]) -> list[list[float]]: ...

    async def aclose(self) -> None: ...
