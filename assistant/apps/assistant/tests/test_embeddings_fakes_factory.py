"""Embeddingi, atrapy (FakeLLMClient, FakeEmbeddingClient) i fabryka z env (TL-06)."""

import json
import math
from collections.abc import Iterator
from typing import Any

import httpx
import pytest
import respx
from pydantic import BaseModel

from assistant.llm import (
    FakeEmbeddingClient,
    FakeLLMClient,
    LLMConfigurationError,
    LLMInvalidOutputError,
    LLMUnavailableError,
    Message,
    OpenAICompatibleClient,
    OpenAICompatibleEmbeddingClient,
    create_embedding_client,
    create_llm_client,
)
from assistant.llm.structured import extract_json

BASE = "https://llm.test/v1"


@pytest.fixture
def router() -> Iterator[respx.MockRouter]:
    with respx.mock(assert_all_called=False) as mock:
        yield mock


# --- embeddingi przez HTTP ---------------------------------------------------------------


async def test_embeddings_request_and_order(router: respx.MockRouter) -> None:
    route = router.post(f"{BASE}/embeddings").mock(
        return_value=httpx.Response(
            200,
            json={
                "data": [
                    {"index": 1, "embedding": [0.0, 1.0, 0.0]},
                    {"index": 0, "embedding": [1.0, 0.0, 0.0]},
                ]
            },
        )
    )
    client = OpenAICompatibleEmbeddingClient(BASE, "bge-m3", api_key="k")
    assert client.dimension is None
    vectors = await client.embed(["art. 180 KP", "zasiłek macierzyński"])
    await client.aclose()
    assert vectors == [[1.0, 0.0, 0.0], [0.0, 1.0, 0.0]]
    assert client.dimension == 3
    assert json.loads(route.calls.last.request.content) == {
        "model": "bge-m3",
        "input": ["art. 180 KP", "zasiłek macierzyński"],
    }


async def test_embeddings_empty_input_makes_no_call(router: respx.MockRouter) -> None:
    route = router.post(f"{BASE}/embeddings")
    client = OpenAICompatibleEmbeddingClient(BASE, "bge-m3")
    assert await client.embed([]) == []
    assert route.call_count == 0


@pytest.mark.parametrize(
    "body",
    [
        {"data": [{"index": 0}]},
        {"data": [{"index": 0, "embedding": [1.0]}, {"index": 1, "embedding": [1.0, 2.0]}]},
        {"data": [{"index": 0, "embedding": [1.0]}]},
    ],
)
async def test_embeddings_inconsistent_response(router: respx.MockRouter, body: Any) -> None:
    router.post(f"{BASE}/embeddings").mock(return_value=httpx.Response(200, json=body))
    client = OpenAICompatibleEmbeddingClient(BASE, "bge-m3", max_attempts=1)
    with pytest.raises(LLMUnavailableError):
        await client.embed(["a", "b"])


# --- atrapy ------------------------------------------------------------------------------


class Answer(BaseModel):
    summary: str


async def test_fake_llm_replays_script_and_records_requests() -> None:
    fake = FakeLLMClient(["<think>x</think>Pierwsza", '{"summary": "druga"}'])
    assert (await fake.complete([Message("user", "a")])).text == "Pierwsza"
    assert await fake.complete_json([Message("user", "b")], Answer) == Answer(summary="druga")
    assert [r[-1].content for r in fake.requests] == ["a", "b"]
    await fake.aclose()
    assert fake.closed


async def test_fake_llm_raises_scripted_error_and_reports_missing_reply() -> None:
    fake = FakeLLMClient([LLMUnavailableError("timeout", 3)])
    with pytest.raises(LLMUnavailableError):
        await fake.complete([Message("user", "a")])
    with pytest.raises(AssertionError, match="brak odpowiedzi nr 2"):
        await fake.complete([Message("user", "b")])


async def test_fake_llm_with_callable_and_json_retries() -> None:
    fake = FakeLLMClient(lambda messages: "nie json", json_retries=2)
    with pytest.raises(LLMInvalidOutputError) as error:
        await fake.complete_json([Message("user", "a")], Answer)
    assert error.value.attempts == 3
    assert len(fake.requests) == 3


def _cosine(a: list[float], b: list[float]) -> float:
    return sum(x * y for x, y in zip(a, b, strict=True))


async def test_fake_embeddings_are_deterministic_and_meaningful() -> None:
    fake = FakeEmbeddingClient(dimension=128)
    query, related, unrelated = await fake.embed(
        [
            "Ile tygodni trwa urlop macierzyński?",
            "Urlop macierzyński trwa 20 tygodni przy jednym dziecku.",
            "Wniosek o zaświadczenie o niezaleganiu w składkach.",
        ]
    )
    assert math.isclose(sum(v * v for v in query), 1.0)
    assert _cosine(query, related) > _cosine(query, unrelated)
    assert await fake.embed(["Urlop macierzyński"]) == await fake.embed(["urlop MACIERZYŃSKI"])
    assert fake.calls == 3
    assert (await fake.embed(["a b"]))[0] == [0.0] * 128  # same krótkie słowa – wektor zerowy
    await fake.aclose()


@pytest.mark.parametrize(
    ("text", "expected"),
    [
        ('{"a": 1}', {"a": 1}),
        ('<think>{"a": 0}</think>{"a": 1}', {"a": 1}),
        ('Wynik:\n```json\n{"a": 2}\n```', {"a": 2}),
        ('Proszę: {"a": 3} – gotowe', {"a": 3}),
    ],
)
def test_extract_json_variants(text: str, expected: Any) -> None:
    assert extract_json(text) == expected


# --- TL-06: fabryka ----------------------------------------------------------------------


def test_tl06_default_is_ovh_olala() -> None:
    client = create_llm_client({})
    assert isinstance(client, OpenAICompatibleClient)
    assert client.model == "Olala-v1.0-mini-7A1B"
    assert client.capabilities.json_schema is True
    assert client.capabilities.reasoning_effort is None


def test_tl06_model_change_without_code_change() -> None:
    client = create_llm_client(
        {
            "LLM_PROVIDER": " OpenAI_Compatible ",
            "LLM_BASE_URL": "https://api-sherlock.cloudferro.com/openai/v1",
            "LLM_MODEL": "speakleash/Bielik-11B-v3.0-Instruct",
            "LLM_API_KEY": "k",
            "LLM_REASONING_EFFORT": "LOW",
            "LLM_JSON_SCHEMA": "false",
            "LLM_TIMEOUT_S": "7.5",
            "LLM_MAX_ATTEMPTS": "2",
        }
    )
    assert isinstance(client, OpenAICompatibleClient)
    assert client.model == "speakleash/Bielik-11B-v3.0-Instruct"
    assert client.capabilities.json_schema is False
    assert client.capabilities.reasoning_effort == "low"


def test_tl06_fake_providers() -> None:
    assert isinstance(create_llm_client({"LLM_PROVIDER": "fake"}), FakeLLMClient)
    assert isinstance(create_embedding_client({}), FakeEmbeddingClient)
    assert isinstance(create_embedding_client({"EMBEDDING_PROVIDER": "fake"}), FakeEmbeddingClient)


def test_tl06_embedding_client_from_env() -> None:
    client = create_embedding_client({"EMBEDDING_MODEL": "bge-m3", "LLM_API_KEY": "k"})
    assert isinstance(client, OpenAICompatibleEmbeddingClient)


def test_tl06_reads_os_environ(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("LLM_PROVIDER", "fake")
    monkeypatch.delenv("EMBEDDING_MODEL", raising=False)
    monkeypatch.delenv("EMBEDDING_PROVIDER", raising=False)
    assert isinstance(create_llm_client(), FakeLLMClient)
    assert isinstance(create_embedding_client(), FakeEmbeddingClient)


@pytest.mark.parametrize(
    ("env", "message"),
    [
        ({"LLM_PROVIDER": "chatbot"}, "LLM_PROVIDER"),
        ({"LLM_BASE_URL": "ftp://x"}, "LLM_BASE_URL"),
        ({"LLM_REASONING_EFFORT": "ultra"}, "LLM_REASONING_EFFORT"),
        ({"LLM_JSON_SCHEMA": "może"}, "LLM_JSON_SCHEMA"),
        ({"LLM_TIMEOUT_S": "szybko"}, "LLM_TIMEOUT_S"),
        ({"LLM_MAX_ATTEMPTS": "0"}, "LLM_MAX_ATTEMPTS"),
    ],
)
def test_tl06_bad_llm_configuration(env: dict[str, str], message: str) -> None:
    with pytest.raises(LLMConfigurationError, match=message) as error:
        create_llm_client(env)
    assert isinstance(error.value, ValueError)


@pytest.mark.parametrize(
    ("env", "message"),
    [
        ({"EMBEDDING_PROVIDER": "word2vec"}, "EMBEDDING_PROVIDER"),
        ({"EMBEDDING_PROVIDER": "openai_compatible"}, "EMBEDDING_MODEL"),
        ({"EMBEDDING_MODEL": "m", "EMBEDDING_BASE_URL": "x"}, "EMBEDDING_BASE_URL"),
    ],
)
def test_tl06_bad_embedding_configuration(env: dict[str, str], message: str) -> None:
    with pytest.raises(LLMConfigurationError, match=message):
        create_embedding_client(env)
