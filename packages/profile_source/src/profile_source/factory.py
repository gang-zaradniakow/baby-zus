"""Wybór adaptera z konfiguracji (``PROFILE_SOURCE``). Zła konfiguracja wychodzi przy starcie."""

import os
from collections.abc import Mapping
from pathlib import Path
from typing import Final

from profile_source.errors import ConfigurationError
from profile_source.http_source import HttpProfileSource
from profile_source.mock import MockProfileSource
from profile_source.port import ProfileSource

DEFAULT_PERSONAS_DIR: Final = "data/personas"
KINDS: Final = ("mock", "http")


def _positive[T: (int, float)](env: Mapping[str, str], name: str, kind: type[T], default: T) -> T:
    raw = env.get(name, "").strip()
    if not raw:
        return default
    try:
        value = kind(raw)
    except ValueError:
        raise ConfigurationError(f"{name}: '{raw}' nie jest liczbą") from None
    if value <= 0:
        raise ConfigurationError(f"{name}: wartość musi być dodatnia, jest {raw}")
    return value


def create_profile_source(env: Mapping[str, str] | None = None) -> ProfileSource:
    """Adapter wg ``PROFILE_SOURCE`` (``mock`` domyślnie albo ``http``)."""
    env = os.environ if env is None else env
    kind = env.get("PROFILE_SOURCE", "mock").strip().lower() or "mock"

    if kind == "mock":
        directory = Path(env.get("PERSONAS_DIR", "").strip() or DEFAULT_PERSONAS_DIR)
        if not directory.is_dir():
            raise ConfigurationError(f"PERSONAS_DIR: katalog '{directory}' nie istnieje")
        return MockProfileSource.from_personas(directory)

    if kind == "http":
        base_url = env.get("BACKEND_URL", "").strip()
        if not base_url.startswith(("http://", "https://")):
            raise ConfigurationError("BACKEND_URL: wymagany adres http(s)://")
        return HttpProfileSource(
            base_url,
            api_key=env.get("BACKEND_API_KEY", "").strip() or None,
            timeout_s=_positive(env, "BACKEND_TIMEOUT_S", float, 5.0),
            max_attempts=_positive(env, "BACKEND_MAX_ATTEMPTS", int, 3),
        )

    raise ConfigurationError(f"PROFILE_SOURCE: '{kind}' – dozwolone: {', '.join(KINDS)}")
