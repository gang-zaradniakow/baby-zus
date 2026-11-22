"""Odczyt odpowiedzi strukturalnej: usunięcie rozumowania, wyłuskanie JSON-a, walidacja, ponowienia.

Wspólne dla prawdziwego klienta i ``FakeLLMClient`` – orkiestrator w testach widzi te same
zachowania co na produkcji (TL-03).
"""

import json
import re
from collections.abc import Awaitable, Callable
from typing import Any, Final

from pydantic import BaseModel, ValidationError

from assistant.llm.base import LLMInvalidOutputError, Message

THINK_RE: Final = re.compile(r"<think>.*?(?:</think>|$)", re.DOTALL | re.IGNORECASE)
FENCE_RE: Final = re.compile(r"```(?:json)?\s*(.*?)```", re.DOTALL | re.IGNORECASE)


def strip_reasoning(text: str) -> str:
    """Usuwa blok ``<think>…</think>`` (modele, które wklejają rozumowanie do ``content``)."""
    return THINK_RE.sub("", text).strip()


def extract_json(text: str) -> Any:
    """JSON z odpowiedzi: cała treść, blok ```json``` albo pierwszy obiekt ``{…}``."""
    cleaned = strip_reasoning(text)
    candidates = [cleaned]
    candidates += FENCE_RE.findall(cleaned)
    start, end = cleaned.find("{"), cleaned.rfind("}")
    if 0 <= start < end:
        candidates.append(cleaned[start : end + 1])
    for candidate in candidates:
        try:
            return json.loads(candidate)
        except ValueError:
            continue
    raise ValueError("odpowiedź nie zawiera poprawnego JSON-a")


def schema_instruction(schema: type[BaseModel]) -> Message:
    """Instrukcja dla modeli bez ``response_format=json_schema`` (tryb promptu)."""
    return Message(
        "system",
        "Odpowiedz wyłącznie jednym obiektem JSON zgodnym z tym schematem, bez komentarzy:\n"
        + json.dumps(schema.model_json_schema(), ensure_ascii=False),
    )


async def complete_structured[M: BaseModel](
    ask: Callable[[list[Message]], Awaitable[str]],
    messages: list[Message],
    schema: type[M],
    *,
    retries: int,
) -> M:
    """Pyta model do skutku: po złej odpowiedzi dokleja opis błędu i pyta ponownie."""
    conversation = list(messages)
    errors: list[str] = []
    for _ in range(retries + 1):
        text = await ask(conversation)
        try:
            return schema.model_validate(extract_json(text))
        except (ValueError, ValidationError) as error:
            problem = _describe(error)
            errors.append(problem)
            conversation += [
                Message("assistant", text),
                Message(
                    "user",
                    f"Poprzednia odpowiedź była niepoprawna ({problem}). "
                    "Odpowiedz ponownie wyłącznie poprawnym JSON-em zgodnym ze schematem.",
                ),
            ]
    raise LLMInvalidOutputError(schema.__name__, retries + 1, errors)


def _describe(error: ValueError | ValidationError) -> str:
    if isinstance(error, ValidationError):
        fields = sorted({".".join(map(str, e["loc"])) or "<root>" for e in error.errors()})
        return "błędne pola: " + ", ".join(fields)
    return "brak poprawnego JSON-a"
