"""Adapter dla API zgodnego z OpenAI (OVHcloud AI Endpoints, Sherlock, vLLM…) – ZUS-50.

Dwa endpointy: ``POST /chat/completions`` i ``POST /embeddings``. Klient HTTP to ``httpx``
(bez SDK ``openai``): ponowienia, timeouty i kształt żądania są w naszych rękach i testach.

- ponawiane: timeout, błąd połączenia, 429 (``Retry-After``), 500/502/503/504;
  odstęp ``backoff_s × 2^(próba−1)``, potem ``LLMUnavailableError``,
- bez ponowień: inne 4xx → ``LLMRequestError`` (zły klucz, zły model – błąd konfiguracji),
- brak klucza = tryb anonimowy (bez nagłówka ``Authorization``; OVH na to pozwala).
"""

import asyncio
import time
from collections.abc import Awaitable, Callable
from typing import Any, Final

import httpx
from pydantic import BaseModel

from assistant.llm.base import (
    Capabilities,
    Completion,
    LLMRequestError,
    LLMUnavailableError,
    Message,
    Usage,
)
from assistant.llm.structured import complete_structured, schema_instruction, strip_reasoning

RETRY_STATUSES: Final = frozenset({429, 500, 502, 503, 504})
MAX_RETRY_AFTER_S: Final = 30.0

Sleep = Callable[[float], Awaitable[None]]


def _retry_after(response: httpx.Response) -> float | None:
    try:
        return min(max(float(response.headers["Retry-After"]), 0.0), MAX_RETRY_AFTER_S)
    except KeyError, ValueError:
        return None


class _Http:
    """Wspólne wywołanie POST z ponowieniami dla czatu i embeddingów."""

    def __init__(
        self,
        base_url: str,
        *,
        api_key: str | None,
        timeout_s: float,
        max_attempts: int,
        backoff_s: float,
        client: httpx.AsyncClient | None,
        sleep: Sleep,
    ) -> None:
        if max_attempts < 1:
            raise ValueError("max_attempts musi być ≥ 1")
        self._client = client or httpx.AsyncClient(timeout=timeout_s)
        self._base_url = base_url.rstrip("/")
        self._headers = {"Accept": "application/json"}
        if api_key:
            self._headers["Authorization"] = f"Bearer {api_key}"
        self._max_attempts = max_attempts
        self._backoff_s = backoff_s
        self._sleep = sleep

    async def post(self, path: str, body: dict[str, Any]) -> dict[str, Any]:
        problem = ""
        for attempt in range(1, self._max_attempts + 1):
            delay = self._backoff_s * 2 ** (attempt - 1)
            try:
                response = await self._client.post(
                    f"{self._base_url}{path}", json=body, headers=self._headers
                )
            except httpx.TimeoutException:
                problem = "przekroczono czas odpowiedzi modelu"
            except httpx.TransportError:
                problem = "brak połączenia z dostawcą modelu"
            else:
                if response.status_code in RETRY_STATUSES:
                    problem = f"dostawca modelu chwilowo niedostępny: HTTP {response.status_code}"
                    delay = max(delay, _retry_after(response) or 0.0)
                elif response.status_code >= httpx.codes.BAD_REQUEST:
                    raise LLMRequestError(response.status_code)
                else:
                    try:
                        data = response.json()
                    except ValueError:
                        problem = "odpowiedź dostawcy nie jest JSON-em"
                    else:
                        if isinstance(data, dict):
                            return data
                        problem = "odpowiedź dostawcy nie jest obiektem JSON"
            if attempt < self._max_attempts:
                await self._sleep(delay)
        raise LLMUnavailableError(problem, self._max_attempts)

    async def aclose(self) -> None:
        await self._client.aclose()


class OpenAICompatibleClient:
    """``LLMClient`` dla ``/chat/completions``; domyślnie OVH + Olala (``.env.example``)."""

    def __init__(
        self,
        base_url: str,
        model: str,
        *,
        api_key: str | None = None,
        reasoning_effort: str | None = None,
        json_schema: bool = True,
        timeout_s: float = 20.0,
        max_attempts: int = 3,
        backoff_s: float = 0.5,
        json_retries: int = 1,
        client: httpx.AsyncClient | None = None,
        sleep: Sleep = asyncio.sleep,
        timer: Callable[[], float] = time.perf_counter,
    ) -> None:
        self._http = _Http(
            base_url,
            api_key=api_key,
            timeout_s=timeout_s,
            max_attempts=max_attempts,
            backoff_s=backoff_s,
            client=client,
            sleep=sleep,
        )
        self._model = model
        self._capabilities = Capabilities(
            json_schema=json_schema, reasoning_effort=reasoning_effort
        )
        self._json_retries = json_retries
        self._timer = timer

    @property
    def capabilities(self) -> Capabilities:
        return self._capabilities

    @property
    def model(self) -> str:
        return self._model

    async def complete(
        self, messages: list[Message], *, max_tokens: int | None = None
    ) -> Completion:
        return await self._chat(messages, max_tokens=max_tokens, response_format=None)

    async def complete_json[M: BaseModel](
        self, messages: list[Message], schema: type[M], *, max_tokens: int | None = None
    ) -> M:
        response_format: dict[str, Any] | None = None
        prompt = list(messages)
        if self._capabilities.json_schema:
            response_format = {
                "type": "json_schema",
                "json_schema": {
                    "name": schema.__name__,
                    "schema": schema.model_json_schema(),
                    "strict": True,
                },
            }
        else:
            prompt = [schema_instruction(schema), *prompt]

        async def ask(conversation: list[Message]) -> str:
            completion = await self._chat(
                conversation, max_tokens=max_tokens, response_format=response_format
            )
            return completion.text

        return await complete_structured(ask, prompt, schema, retries=self._json_retries)

    async def _chat(
        self,
        messages: list[Message],
        *,
        max_tokens: int | None,
        response_format: dict[str, Any] | None,
    ) -> Completion:
        body: dict[str, Any] = {
            "model": self._model,
            "messages": [{"role": m.role, "content": m.content} for m in messages],
        }
        if max_tokens is not None:
            body["max_tokens"] = max_tokens
        if self._capabilities.reasoning_effort is not None:
            body["reasoning_effort"] = self._capabilities.reasoning_effort
        if response_format is not None:
            body["response_format"] = response_format

        start = self._timer()
        data = await self._http.post("/chat/completions", body)
        latency = self._timer() - start
        return Completion(
            text=strip_reasoning(_content(data)),
            model=str(data.get("model") or self._model),
            usage=_usage(data.get("usage")),
            latency_s=latency,
        )

    async def aclose(self) -> None:
        await self._http.aclose()


def _content(data: dict[str, Any]) -> str:
    try:
        content = data["choices"][0]["message"]["content"]
    except KeyError, IndexError, TypeError:
        return ""
    return content if isinstance(content, str) else ""


def _usage(raw: Any) -> Usage:
    if not isinstance(raw, dict):
        return Usage()
    details = raw.get("completion_tokens_details")
    reasoning = details.get("reasoning_tokens") if isinstance(details, dict) else None
    return Usage(
        prompt_tokens=raw.get("prompt_tokens"),
        completion_tokens=raw.get("completion_tokens"),
        reasoning_tokens=reasoning,
    )


class OpenAICompatibleEmbeddingClient:
    """``EmbeddingClient`` dla ``/embeddings`` (wektory w kolejności wejścia)."""

    def __init__(
        self,
        base_url: str,
        model: str,
        *,
        api_key: str | None = None,
        timeout_s: float = 20.0,
        max_attempts: int = 3,
        backoff_s: float = 0.5,
        client: httpx.AsyncClient | None = None,
        sleep: Sleep = asyncio.sleep,
    ) -> None:
        self._http = _Http(
            base_url,
            api_key=api_key,
            timeout_s=timeout_s,
            max_attempts=max_attempts,
            backoff_s=backoff_s,
            client=client,
            sleep=sleep,
        )
        self._model = model
        self._dimension: int | None = None

    @property
    def dimension(self) -> int | None:
        return self._dimension

    async def embed(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []
        data = await self._http.post("/embeddings", {"model": self._model, "input": texts})
        try:
            items = sorted(data["data"], key=lambda item: item["index"])
            vectors = [[float(x) for x in item["embedding"]] for item in items]
        except KeyError, TypeError, ValueError:
            raise LLMUnavailableError("niepoprawna odpowiedź /embeddings", 1) from None
        if len(vectors) != len(texts) or len({len(v) for v in vectors}) != 1:
            raise LLMUnavailableError("niespójna liczba lub wymiar wektorów", 1)
        self._dimension = len(vectors[0])
        return vectors

    async def aclose(self) -> None:
        await self._http.aclose()
