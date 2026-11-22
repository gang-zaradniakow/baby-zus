"""Adapter http: ponowienia, mapowanie błędów, nagłówki (TP-05…07); ``sleep`` tylko rejestruje."""

from typing import Any

import httpx
import pytest
import respx

from contracts import Profile, Stage
from profile_source import (
    BackendContractError,
    BackendUnavailableError,
    ConsentRequiredError,
    HttpProfileSource,
    ProfileNotFoundError,
)
from profile_source.http_source import error_code, retry_after_seconds

BASE = "https://backend.test"
PROFILE_PATH = "/v1/profiles/u1"
PROFILE_JSON: dict[str, Any] = {
    "profileId": "u1",
    "applicant": {"role": "MOTHER", "insurance": {"source": "ZUS"}},
    "child": {"source": "USER", "birthDate": "2026-11-12"},
}


class SleepRecorder:
    def __init__(self) -> None:
        self.delays: list[float] = []

    async def __call__(self, seconds: float) -> None:
        self.delays.append(seconds)


@pytest.fixture
def sleep() -> SleepRecorder:
    return SleepRecorder()


@pytest.fixture
async def http_source(sleep: SleepRecorder) -> Any:
    source = HttpProfileSource(BASE, api_key="secret-key", sleep=sleep)
    yield source
    await source.aclose()


@pytest.fixture
def backend() -> Any:
    with respx.mock(base_url=BASE, assert_all_called=False) as router:
        yield router


def ok() -> httpx.Response:
    return httpx.Response(200, json=PROFILE_JSON)


async def test_tp05_timeout_gives_unavailable_after_all_attempts(
    http_source: HttpProfileSource, backend: respx.MockRouter, sleep: SleepRecorder
) -> None:
    route = backend.get(PROFILE_PATH).mock(side_effect=httpx.ConnectTimeout("timeout"))
    with pytest.raises(BackendUnavailableError, match="czas") as error:
        await http_source.get_profile("u1")
    assert error.value.attempts == 3
    assert route.call_count == 3
    assert sleep.delays == [0.2, 0.4]


async def test_tp05_connection_error_is_retried(
    http_source: HttpProfileSource, backend: respx.MockRouter
) -> None:
    route = backend.get(PROFILE_PATH).mock(side_effect=[httpx.ConnectError("down"), ok()])
    assert (await http_source.get_profile("u1")).profile_id == "u1"
    assert route.call_count == 2


async def test_tp06_two_503_then_success(
    http_source: HttpProfileSource, backend: respx.MockRouter, sleep: SleepRecorder
) -> None:
    route = backend.get(PROFILE_PATH).mock(
        side_effect=[httpx.Response(503), httpx.Response(503), ok()]
    )
    profile = await http_source.get_profile("u1")
    assert isinstance(profile, Profile)
    assert route.call_count == 3
    assert sleep.delays == [0.2, 0.4]


async def test_tp06_client_error_is_not_retried(
    http_source: HttpProfileSource, backend: respx.MockRouter
) -> None:
    route = backend.get(PROFILE_PATH).mock(return_value=httpx.Response(400))
    with pytest.raises(BackendContractError, match="HTTP 400"):
        await http_source.get_profile("u1")
    assert route.call_count == 1


async def test_tp06_429_waits_retry_after(
    http_source: HttpProfileSource, backend: respx.MockRouter, sleep: SleepRecorder
) -> None:
    backend.get(PROFILE_PATH).mock(
        side_effect=[httpx.Response(429, headers={"Retry-After": "2"}), ok()]
    )
    await http_source.get_profile("u1")
    assert sleep.delays == [2.0]


async def test_tp06_persistent_502_is_unavailable(
    http_source: HttpProfileSource, backend: respx.MockRouter
) -> None:
    route = backend.get(PROFILE_PATH).mock(return_value=httpx.Response(502))
    with pytest.raises(BackendUnavailableError, match="HTTP 502"):
        await http_source.get_profile("u1")
    assert route.call_count == 3


async def test_tp07_missing_fields_are_named(
    http_source: HttpProfileSource, backend: respx.MockRouter
) -> None:
    backend.get(PROFILE_PATH).mock(return_value=httpx.Response(200, json={"profileId": "u1"}))
    with pytest.raises(BackendContractError) as error:
        await http_source.get_profile("u1")
    assert "applicant" in error.value.fields
    assert "child" in error.value.fields


async def test_tp07_non_object_body_reports_root(
    http_source: HttpProfileSource, backend: respx.MockRouter
) -> None:
    backend.get(PROFILE_PATH).mock(return_value=httpx.Response(200, json=[1, 2]))
    with pytest.raises(BackendContractError) as error:
        await http_source.get_profile("u1")
    assert error.value.fields == ("<root>",)


async def test_tp07_html_instead_of_json(
    http_source: HttpProfileSource, backend: respx.MockRouter
) -> None:
    backend.get(PROFILE_PATH).mock(return_value=httpx.Response(200, text="<html>błąd</html>"))
    with pytest.raises(BackendContractError, match="JSON"):
        await http_source.get_profile("u1")


async def test_403_without_consent_code_is_contract_error(
    http_source: HttpProfileSource, backend: respx.MockRouter
) -> None:
    backend.get(f"{PROFILE_PATH}/partner").mock(
        return_value=httpx.Response(403, json={"code": "FORBIDDEN"})
    )
    with pytest.raises(BackendContractError, match="HTTP 403"):
        await http_source.get_partner_profile("u1")


async def test_403_with_consent_code(
    http_source: HttpProfileSource, backend: respx.MockRouter
) -> None:
    backend.get(f"{PROFILE_PATH}/partner").mock(
        return_value=httpx.Response(403, json={"code": "CONSENT_REQUIRED", "message": "-"})
    )
    with pytest.raises(ConsentRequiredError):
        await http_source.get_partner_profile("u1")


async def test_404_on_stage(http_source: HttpProfileSource, backend: respx.MockRouter) -> None:
    backend.get(f"{PROFILE_PATH}/stage").mock(return_value=httpx.Response(404))
    with pytest.raises(ProfileNotFoundError, match="u1/stage"):
        await http_source.get_child_stage("u1")


async def test_stage_and_headers(http_source: HttpProfileSource, backend: respx.MockRouter) -> None:
    route = backend.get(f"{PROFILE_PATH}/stage").mock(
        return_value=httpx.Response(200, json={"stage": "E2", "flags": []})
    )
    assert (await http_source.get_child_stage("u1")).stage is Stage.E2
    request = route.calls.last.request
    assert request.headers["Authorization"] == "Bearer secret-key"
    assert request.headers["Accept"] == "application/json"


async def test_user_ref_is_url_encoded(
    http_source: HttpProfileSource, backend: respx.MockRouter
) -> None:
    route = backend.get(url__regex=r".*").mock(return_value=httpx.Response(404))
    with pytest.raises(ProfileNotFoundError):
        await http_source.get_profile("a/b?c")
    assert route.calls.last.request.url.raw_path == b"/v1/profiles/a%2Fb%3Fc"


async def test_without_api_key_no_authorization(backend: respx.MockRouter) -> None:
    route = backend.get(PROFILE_PATH).mock(return_value=ok())
    async with HttpProfileSource(BASE) as source:
        await source.get_profile("u1")
    assert "Authorization" not in route.calls.last.request.headers


async def test_context_manager_closes_injected_client() -> None:
    client = httpx.AsyncClient(base_url=BASE)
    async with HttpProfileSource(BASE, client=client):
        assert not client.is_closed
    assert client.is_closed


def test_max_attempts_must_be_positive() -> None:
    with pytest.raises(ValueError, match="max_attempts"):
        HttpProfileSource(BASE, max_attempts=0)


@pytest.mark.parametrize(
    ("header", "expected"),
    [(None, None), ("abc", None), ("2", 2.0), ("100", 30.0), ("-5", 0.0)],
)
def test_retry_after_parsing(header: str | None, expected: float | None) -> None:
    headers = {} if header is None else {"Retry-After": header}
    assert retry_after_seconds(httpx.Response(429, headers=headers)) == expected


@pytest.mark.parametrize(
    ("response", "expected"),
    [
        (httpx.Response(403, json={"code": "CONSENT_REQUIRED"}), "CONSENT_REQUIRED"),
        (httpx.Response(403, json={"code": 7}), None),
        (httpx.Response(403, json=["CONSENT_REQUIRED"]), None),
        (httpx.Response(403, text="nie JSON"), None),
    ],
)
def test_error_code_parsing(response: httpx.Response, expected: str | None) -> None:
    assert error_code(response) == expected
