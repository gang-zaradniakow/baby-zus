"""ZUS-50: klient API zgodnego z OpenAI – kształt żądań, JSON, ponowienia (TL-01…TL-05)."""

import json
from collections.abc import AsyncIterator, Iterator
from typing import Any

import httpx
import pytest
import respx
from pydantic import BaseModel

from assistant.llm import (
    LLMInvalidOutputError,
    LLMRequestError,
    LLMUnavailableError,
    Message,
    OpenAICompatibleClient,
)

BASE = "https://llm.test/v1"
CHAT = f"{BASE}/chat/completions"
MESSAGES = [Message("system", "Jesteś asystentem ZUS."), Message("user", "Ile tygodni?")]


class Intent(BaseModel):
    intent_id: str
    confidence: float


def reply(content: str | None, **extra: Any) -> httpx.Response:
    body: dict[str, Any] = {
        "model": "Olala-v1.0-mini-7A1B",
        "choices": [{"message": {"role": "assistant", "content": content}}],
        "usage": {
            "prompt_tokens": 50,
            "completion_tokens": 20,
            "completion_tokens_details": {"reasoning_tokens": 12},
        },
        **extra,
    }
    return httpx.Response(200, json=body)


class Sleeps:
    def __init__(self) -> None:
        self.delays: list[float] = []

    async def __call__(self, seconds: float) -> None:
        self.delays.append(seconds)


@pytest.fixture
def sleeps() -> Sleeps:
    return Sleeps()


@pytest.fixture
def router() -> Iterator[respx.MockRouter]:
    with respx.mock(assert_all_called=False) as mock:
        yield mock


def make_client(sleeps: Sleeps, **overrides: Any) -> OpenAICompatibleClient:
    options: dict[str, Any] = {
        "api_key": "sekretny-klucz",
        "reasoning_effort": "low",
        "sleep": sleeps,
        "timer": iter([1.0, 1.25, 2.0, 2.5, 3.0, 3.5]).__next__,
    }
    options.update(overrides)
    return OpenAICompatibleClient(BASE, "Olala-v1.0-mini-7A1B", **options)


@pytest.fixture
async def client(sleeps: Sleeps) -> AsyncIterator[OpenAICompatibleClient]:
    llm = make_client(sleeps)
    yield llm
    await llm.aclose()


def sent(route: respx.Route, index: int = -1) -> dict[str, Any]:
    body: dict[str, Any] = json.loads(route.calls[index].request.content)
    return body


# --- TL-01: kształt żądania ---------------------------------------------------------------


async def test_tl01_request_shape(router: respx.MockRouter, client: OpenAICompatibleClient) -> None:
    route = router.post(CHAT).mock(return_value=reply("Przysługuje 20 tygodni."))
    completion = await client.complete(MESSAGES, max_tokens=300)

    request = route.calls.last.request
    assert request.headers["Authorization"] == "Bearer sekretny-klucz"
    assert sent(route) == {
        "model": "Olala-v1.0-mini-7A1B",
        "messages": [
            {"role": "system", "content": "Jesteś asystentem ZUS."},
            {"role": "user", "content": "Ile tygodni?"},
        ],
        "max_tokens": 300,
        "reasoning_effort": "low",
    }
    assert completion.text == "Przysługuje 20 tygodni."
    assert completion.usage.reasoning_tokens == 12
    assert completion.usage.prompt_tokens == 50
    assert completion.latency_s == 0.25


async def test_tl01_anonymous_mode_and_defaults(router: respx.MockRouter, sleeps: Sleeps) -> None:
    route = router.post(CHAT).mock(return_value=reply("ok"))
    llm = make_client(sleeps, api_key=None, reasoning_effort=None)
    await llm.complete(MESSAGES)
    await llm.aclose()
    assert "Authorization" not in route.calls.last.request.headers
    assert set(sent(route)) == {"model", "messages"}


async def test_reasoning_block_is_stripped(
    router: respx.MockRouter, client: OpenAICompatibleClient
) -> None:
    router.post(CHAT).mock(return_value=reply("<think>liczę 7000 × 0,815…</think>Wynik w karcie."))
    assert (await client.complete(MESSAGES)).text == "Wynik w karcie."


@pytest.mark.parametrize(
    "body",
    [
        {"choices": [], "usage": None},
        {"choices": [{"message": {"content": None}}], "usage": {"prompt_tokens": 1}},
    ],
)
async def test_missing_content_gives_empty_text(
    router: respx.MockRouter, client: OpenAICompatibleClient, body: dict[str, Any]
) -> None:
    router.post(CHAT).mock(return_value=httpx.Response(200, json=body))
    completion = await client.complete(MESSAGES)
    assert completion.text == ""
    assert completion.model == "Olala-v1.0-mini-7A1B"


# --- TL-02 / TL-03: JSON -----------------------------------------------------------------


async def test_tl02_response_format_with_json_schema(
    router: respx.MockRouter, client: OpenAICompatibleClient
) -> None:
    route = router.post(CHAT).mock(
        return_value=reply('{"intent_id": "B.01_wysokosc_macierzynskiego", "confidence": 0.9}')
    )
    result = await client.complete_json(MESSAGES, Intent)
    assert result == Intent(intent_id="B.01_wysokosc_macierzynskiego", confidence=0.9)
    response_format = sent(route)["response_format"]
    assert response_format["type"] == "json_schema"
    assert response_format["json_schema"]["name"] == "Intent"
    assert response_format["json_schema"]["schema"] == Intent.model_json_schema()


async def test_tl02_prompt_mode_without_json_schema(
    router: respx.MockRouter, sleeps: Sleeps
) -> None:
    route = router.post(CHAT).mock(
        return_value=reply('```json\n{"intent_id": "OUT_OF_CATALOG", "confidence": 0.2}\n```')
    )
    llm = make_client(sleeps, json_schema=False)
    result = await llm.complete_json(MESSAGES, Intent)
    await llm.aclose()
    assert result.intent_id == "OUT_OF_CATALOG"
    body = sent(route)
    assert "response_format" not in body
    assert body["messages"][0]["role"] == "system"
    assert "JSON" in body["messages"][0]["content"]
    assert "intent_id" in body["messages"][0]["content"]


async def test_tl03_bad_json_is_retried_with_feedback(
    router: respx.MockRouter, client: OpenAICompatibleClient
) -> None:
    route = router.post(CHAT).mock(
        side_effect=[
            reply("Myślę, że chodzi o macierzyński."),
            reply('Oto wynik: {"intent_id": "B.01_wysokosc_macierzynskiego", "confidence": 1}'),
        ]
    )
    result = await client.complete_json(MESSAGES, Intent)
    assert result.confidence == 1.0
    assert route.call_count == 2
    retry_messages = sent(route, 1)["messages"]
    assert retry_messages[-2] == {
        "role": "assistant",
        "content": "Myślę, że chodzi o macierzyński.",
    }
    assert "niepoprawna" in retry_messages[-1]["content"]


async def test_tl03_invalid_output_after_retries(
    router: respx.MockRouter, client: OpenAICompatibleClient
) -> None:
    route = router.post(CHAT).mock(
        side_effect=[reply("{}"), reply('{"intent_id": 5, "confidence": "dużo"}')]
    )
    with pytest.raises(LLMInvalidOutputError) as error:
        await client.complete_json(MESSAGES, Intent)
    assert error.value.attempts == 2
    assert route.call_count == 2
    assert error.value.errors == [
        "błędne pola: confidence, intent_id",
        "błędne pola: confidence, intent_id",
    ]


async def test_tl03_no_json_at_all(router: respx.MockRouter, sleeps: Sleeps) -> None:
    router.post(CHAT).mock(return_value=reply("{ to nie jest json }"))
    llm = make_client(sleeps, json_retries=0)
    with pytest.raises(LLMInvalidOutputError) as error:
        await llm.complete_json(MESSAGES, Intent)
    await llm.aclose()
    assert error.value.errors == ["brak poprawnego JSON-a"]


# --- TL-04 / TL-05: dostępność -----------------------------------------------------------


async def test_tl04_timeout_gives_unavailable(
    router: respx.MockRouter, client: OpenAICompatibleClient, sleeps: Sleeps
) -> None:
    route = router.post(CHAT).mock(side_effect=httpx.ReadTimeout("timeout"))
    with pytest.raises(LLMUnavailableError, match="czas") as error:
        await client.complete(MESSAGES)
    assert error.value.attempts == 3
    assert route.call_count == 3
    assert sleeps.delays == [0.5, 1.0]


async def test_connection_error_is_retried(
    router: respx.MockRouter, client: OpenAICompatibleClient
) -> None:
    route = router.post(CHAT).mock(side_effect=[httpx.ConnectError("down"), reply("ok")])
    assert (await client.complete(MESSAGES)).text == "ok"
    assert route.call_count == 2


@pytest.mark.parametrize("status", [429, 500, 502, 503, 504])
async def test_tl05_transient_statuses_are_retried(
    router: respx.MockRouter, client: OpenAICompatibleClient, status: int
) -> None:
    route = router.post(CHAT).mock(side_effect=[httpx.Response(status), reply("ok")])
    assert (await client.complete(MESSAGES)).text == "ok"
    assert route.call_count == 2


async def test_tl05_retry_after_is_respected(
    router: respx.MockRouter, client: OpenAICompatibleClient, sleeps: Sleeps
) -> None:
    router.post(CHAT).mock(
        side_effect=[
            httpx.Response(429, headers={"Retry-After": "4"}),
            httpx.Response(429, headers={"Retry-After": "999"}),
            reply("ok"),
        ]
    )
    await client.complete(MESSAGES)
    assert sleeps.delays == [4.0, 30.0]


@pytest.mark.parametrize("status", [400, 401, 403, 404, 422])
async def test_tl05_client_errors_are_not_retried(
    router: respx.MockRouter, client: OpenAICompatibleClient, status: int
) -> None:
    route = router.post(CHAT).mock(return_value=httpx.Response(status, json={"error": "x"}))
    with pytest.raises(LLMRequestError) as error:
        await client.complete(MESSAGES)
    assert error.value.status_code == status
    assert route.call_count == 1


@pytest.mark.parametrize(
    "response",
    [httpx.Response(200, text="<html>proxy</html>"), httpx.Response(200, json=["lista"])],
)
async def test_non_object_responses_end_as_unavailable(
    router: respx.MockRouter, client: OpenAICompatibleClient, response: httpx.Response
) -> None:
    router.post(CHAT).mock(return_value=response)
    with pytest.raises(LLMUnavailableError):
        await client.complete(MESSAGES)


def test_max_attempts_must_be_positive(sleeps: Sleeps) -> None:
    with pytest.raises(ValueError, match="max_attempts"):
        make_client(sleeps, max_attempts=0)


def test_capabilities_and_model(sleeps: Sleeps) -> None:
    llm = make_client(sleeps, json_schema=False)
    assert llm.capabilities.json_schema is False
    assert llm.capabilities.reasoning_effort == "low"
    assert llm.model == "Olala-v1.0-mini-7A1B"
