"""Klienci LLM i embeddingów z konfiguracji (``LLM_*``, ``EMBEDDING_*``) – TL-06.

Zmiana dostawcy albo modelu to zmiana zmiennych, nie kodu (U6). Zła konfiguracja daje
``LLMConfigurationError`` przy starcie aplikacji, a nie przy pierwszym pytaniu użytkownika.

``LLM_PROVIDER``: ``openai_compatible`` (domyślnie) albo ``fake`` (testy, demo bez sieci).
``LLM_REASONING_EFFORT``: none, minimal, low, medium, high, max albo puste (domyślny serwera).
``EMBEDDING_PROVIDER``: domyślnie ``openai_compatible``, gdy ustawiono ``EMBEDDING_MODEL``,
inaczej ``fake``. ``EMBEDDING_BASE_URL`` i ``EMBEDDING_API_KEY`` domyślnie jak dla LLM.
"""

import os
from collections.abc import Mapping
from typing import Final

from assistant.llm.base import EmbeddingClient, LLMClient, LLMConfigurationError
from assistant.llm.fake import FakeEmbeddingClient, FakeLLMClient
from assistant.llm.openai_compatible import OpenAICompatibleClient, OpenAICompatibleEmbeddingClient

DEFAULT_BASE_URL: Final = "https://oai.endpoints.kepler.ai.cloud.ovh.net/v1"
DEFAULT_MODEL: Final = "Olala-v1.0-mini-7A1B"
REASONING_EFFORTS: Final = ("none", "minimal", "low", "medium", "high", "max")
TRUE: Final = {"1", "true", "yes", "tak"}
FALSE: Final = {"0", "false", "no", "nie"}


def _get(env: Mapping[str, str], name: str, default: str = "") -> str:
    return env.get(name, "").strip() or default


def _url(env: Mapping[str, str], name: str, default: str) -> str:
    url = _get(env, name, default)
    if not url.startswith(("http://", "https://")):
        raise LLMConfigurationError(f"{name}: wymagany adres http(s)://")
    return url


def _positive[T: (int, float)](env: Mapping[str, str], name: str, kind: type[T], default: T) -> T:
    raw = _get(env, name)
    if not raw:
        return default
    try:
        value = kind(raw)
    except ValueError:
        raise LLMConfigurationError(f"{name}: '{raw}' nie jest liczbą") from None
    if value <= 0:
        raise LLMConfigurationError(f"{name}: wartość musi być dodatnia")
    return value


def _flag(env: Mapping[str, str], name: str, default: bool) -> bool:
    raw = _get(env, name).lower()
    if not raw:
        return default
    if raw in TRUE | FALSE:
        return raw in TRUE
    raise LLMConfigurationError(f"{name}: oczekiwano true/false")


def create_llm_client(env: Mapping[str, str] | None = None) -> LLMClient:
    env = os.environ if env is None else env
    provider = _get(env, "LLM_PROVIDER", "openai_compatible").lower()
    if provider == "fake":
        return FakeLLMClient()
    if provider != "openai_compatible":
        raise LLMConfigurationError(
            f"LLM_PROVIDER: '{provider}' – dozwolone: openai_compatible, fake"
        )
    effort = _get(env, "LLM_REASONING_EFFORT").lower() or None
    if effort is not None and effort not in REASONING_EFFORTS:
        raise LLMConfigurationError(
            f"LLM_REASONING_EFFORT: '{effort}' – dozwolone: {', '.join(REASONING_EFFORTS)}"
        )
    return OpenAICompatibleClient(
        _url(env, "LLM_BASE_URL", DEFAULT_BASE_URL),
        _get(env, "LLM_MODEL", DEFAULT_MODEL),
        api_key=_get(env, "LLM_API_KEY") or None,
        reasoning_effort=effort,
        json_schema=_flag(env, "LLM_JSON_SCHEMA", default=True),
        timeout_s=_positive(env, "LLM_TIMEOUT_S", float, 20.0),
        max_attempts=_positive(env, "LLM_MAX_ATTEMPTS", int, 3),
    )


def create_embedding_client(env: Mapping[str, str] | None = None) -> EmbeddingClient:
    env = os.environ if env is None else env
    model = _get(env, "EMBEDDING_MODEL")
    provider = _get(env, "EMBEDDING_PROVIDER", "openai_compatible" if model else "fake").lower()
    if provider == "fake":
        return FakeEmbeddingClient()
    if provider != "openai_compatible":
        raise LLMConfigurationError(
            f"EMBEDDING_PROVIDER: '{provider}' – dozwolone: openai_compatible, fake"
        )
    if not model:
        raise LLMConfigurationError("EMBEDDING_MODEL: wymagany dla openai_compatible")
    return OpenAICompatibleEmbeddingClient(
        _url(env, "EMBEDDING_BASE_URL", _get(env, "LLM_BASE_URL", DEFAULT_BASE_URL)),
        model,
        api_key=_get(env, "EMBEDDING_API_KEY") or _get(env, "LLM_API_KEY") or None,
        timeout_s=_positive(env, "LLM_TIMEOUT_S", float, 20.0),
        max_attempts=_positive(env, "LLM_MAX_ATTEMPTS", int, 3),
    )
