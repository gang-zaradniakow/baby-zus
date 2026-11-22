"""Adapter http: zewnętrzny backend z danymi profilu (kontrakt: backend-profile.openapi.json).

Ponawiamy tylko błędy przejściowe (timeout, brak połączenia, 429, 5xx z ``RETRY_STATUSES``)
z odstępem ``backoff_s * 2^(próba-1)``; przy 429 czekamy co najmniej ``Retry-After``
(maks. ``MAX_RETRY_AFTER_S``). Pozostałe błędy mapujemy od razu na wyjątki domenowe.
"""

import asyncio
from collections.abc import Awaitable, Callable
from types import TracebackType
from typing import Final, Self
from urllib.parse import quote

import httpx
from pydantic import BaseModel, ValidationError

from contracts import ParentProfile, Profile, StageInfo
from profile_source.errors import (
    BackendContractError,
    BackendUnavailableError,
    ConsentRequiredError,
    ProfileNotFoundError,
)

API_PREFIX: Final = "/v1/profiles"
CONSENT_CODE: Final = "CONSENT_REQUIRED"
RETRY_STATUSES: Final = frozenset({429, 500, 502, 503, 504})
MAX_RETRY_AFTER_S: Final = 30.0

Sleep = Callable[[float], Awaitable[None]]


def retry_after_seconds(response: httpx.Response) -> float | None:
    """Wartość ``Retry-After`` w sekundach (format liczbowy); inne formaty pomijamy."""
    raw = response.headers.get("Retry-After")
    if raw is None:
        return None
    try:
        value = float(raw)
    except ValueError:
        return None
    return min(max(value, 0.0), MAX_RETRY_AFTER_S)


def error_code(response: httpx.Response) -> str | None:
    """Pole ``code`` z treści błędu ``{"code": ..., "message": ...}``, jeśli jest."""
    try:
        body = response.json()
    except ValueError:
        return None
    code = body.get("code") if isinstance(body, dict) else None
    return code if isinstance(code, str) else None


def _field_names(error: ValidationError) -> tuple[str, ...]:
    """Ścieżki błędnych pól (``applicant``, ``child.birthDate``) bez powtórzeń, w kolejności."""
    paths = (".".join(str(part) for part in item["loc"]) or "<root>" for item in error.errors())
    return tuple(dict.fromkeys(paths))


class HttpProfileSource:
    """Implementacja portu nad REST API backendu profilu (httpx, async)."""

    def __init__(
        self,
        base_url: str,
        *,
        api_key: str | None = None,
        timeout_s: float = 5.0,
        max_attempts: int = 3,
        backoff_s: float = 0.2,
        client: httpx.AsyncClient | None = None,
        sleep: Sleep = asyncio.sleep,
    ) -> None:
        if max_attempts < 1:
            raise ValueError("max_attempts musi być ≥ 1")
        headers = {"Accept": "application/json"}
        if api_key:
            headers["Authorization"] = f"Bearer {api_key}"
        self._client = client or httpx.AsyncClient(base_url=base_url, timeout=timeout_s)
        self._client.headers.update(headers)
        self._max_attempts = max_attempts
        self._backoff_s = backoff_s
        self._sleep = sleep

    async def __aenter__(self) -> Self:
        return self

    async def __aexit__(
        self,
        exc_type: type[BaseException] | None,
        exc: BaseException | None,
        tb: TracebackType | None,
    ) -> None:
        await self.aclose()

    async def aclose(self) -> None:
        await self._client.aclose()

    # --- port ----------------------------------------------------------------------------

    async def get_profile(self, user_ref: str) -> Profile:
        return await self._get(user_ref, "", Profile)

    async def get_partner_profile(self, user_ref: str) -> ParentProfile:
        return await self._get(user_ref, "/partner", ParentProfile)

    async def get_child_stage(self, user_ref: str) -> StageInfo:
        return await self._get(user_ref, "/stage", StageInfo)

    # --- wspólna ścieżka -----------------------------------------------------------------

    async def _get[M: BaseModel](self, user_ref: str, suffix: str, model: type[M]) -> M:
        path = f"{API_PREFIX}/{quote(user_ref, safe='')}{suffix}"
        response = await self._request(path)
        if response.status_code == httpx.codes.NOT_FOUND:
            raise ProfileNotFoundError(user_ref + suffix)
        if response.status_code == httpx.codes.FORBIDDEN and error_code(response) == CONSENT_CODE:
            raise ConsentRequiredError(user_ref)
        if response.status_code >= httpx.codes.BAD_REQUEST:
            raise BackendContractError(
                f"nieoczekiwana odpowiedź backendu: HTTP {response.status_code}"
            )
        try:
            data = response.json()
        except ValueError:
            raise BackendContractError("odpowiedź backendu nie jest poprawnym JSON-em") from None
        try:
            return model.model_validate(data)
        except ValidationError as error:
            raise BackendContractError(
                f"odpowiedź backendu niezgodna z modelem {model.__name__}", _field_names(error)
            ) from None

    async def _request(self, path: str) -> httpx.Response:
        last_problem = ""
        for attempt in range(1, self._max_attempts + 1):
            delay = self._backoff_s * 2 ** (attempt - 1)
            try:
                response = await self._client.get(path)
            except httpx.TimeoutException:
                last_problem = "przekroczono czas odpowiedzi backendu"
            except httpx.TransportError:
                last_problem = "brak połączenia z backendem"
            else:
                if response.status_code not in RETRY_STATUSES:
                    return response
                last_problem = f"backend chwilowo niedostępny: HTTP {response.status_code}"
                retry_after = retry_after_seconds(response)
                if retry_after is not None:
                    delay = max(delay, retry_after)
            if attempt < self._max_attempts:
                await self._sleep(delay)
        raise BackendUnavailableError(last_problem, self._max_attempts)
