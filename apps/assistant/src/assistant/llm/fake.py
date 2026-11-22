"""Atrapy LLM i embeddingów do testów (bez sieci, deterministyczne).

``FakeLLMClient`` odtwarza zaplanowane odpowiedzi (tekst albo wyjątek) i zapisuje każde
żądanie – testy sprawdzają, co trafiło do promptu (np. brak PESEL, TL-35). JSON czyta tym
samym parserem z ponowieniami co prawdziwy klient.

``FakeEmbeddingClient`` liczy wektor z „rdzeni” słów (pierwsze litery, bez polskich znaków)
haszowanych do stałego wymiaru – teksty o wspólnych słowach są do siebie podobne, więc
ranking w testach RAG (TM-17) ma sens bez prawdziwego modelu.
"""

import hashlib
import math
import re
import unicodedata
from collections.abc import Callable, Sequence
from dataclasses import dataclass, field
from typing import Final

from pydantic import BaseModel

from assistant.llm.base import Capabilities, Completion, LLMError, Message
from assistant.llm.structured import complete_structured, strip_reasoning

Script = Sequence[str | LLMError] | Callable[[list[Message]], str]


@dataclass
class FakeLLMClient:
    script: Script = ()
    capabilities: Capabilities = field(default_factory=lambda: Capabilities(json_schema=True))
    json_retries: int = 1
    model: str = "fake-llm"
    requests: list[list[Message]] = field(default_factory=list)
    closed: bool = False

    async def complete(
        self, messages: list[Message], *, max_tokens: int | None = None
    ) -> Completion:
        self.requests.append(list(messages))
        if callable(self.script):
            reply: str | LLMError = self.script(messages)
        else:
            index = len(self.requests) - 1
            if index >= len(self.script):
                raise AssertionError(f"FakeLLMClient: brak odpowiedzi nr {index + 1} w scenariuszu")
            reply = self.script[index]
        if isinstance(reply, LLMError):
            raise reply
        return Completion(text=strip_reasoning(reply), model=self.model)

    async def complete_json[M: BaseModel](
        self, messages: list[Message], schema: type[M], *, max_tokens: int | None = None
    ) -> M:
        async def ask(conversation: list[Message]) -> str:
            return (await self.complete(conversation, max_tokens=max_tokens)).text

        return await complete_structured(ask, messages, schema, retries=self.json_retries)

    async def aclose(self) -> None:
        self.closed = True


STEM_LENGTH: Final = 6
WORD_RE: Final = re.compile(r"\w+", re.UNICODE)


def _stems(text: str) -> list[str]:
    ascii_text = unicodedata.normalize("NFKD", text.lower().replace("ł", "l"))
    ascii_text = ascii_text.encode("ascii", "ignore").decode()
    return [word[:STEM_LENGTH] for word in WORD_RE.findall(ascii_text) if len(word) > 2]


@dataclass
class FakeEmbeddingClient:
    dimension: int = 256
    calls: int = 0

    async def embed(self, texts: list[str]) -> list[list[float]]:
        self.calls += 1
        return [self.vector(text) for text in texts]

    def vector(self, text: str) -> list[float]:
        values = [0.0] * self.dimension
        for stem in _stems(text):
            bucket = int.from_bytes(hashlib.sha256(stem.encode()).digest()[:4], "big")
            values[bucket % self.dimension] += 1.0
        norm = math.sqrt(sum(v * v for v in values)) or 1.0
        return [v / norm for v in values]

    async def aclose(self) -> None:
        return None
