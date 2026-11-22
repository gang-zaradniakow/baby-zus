"""Wspólne fixture testów kontraktowych: oba adaptery na tych samych danych.

Adapter http rozmawia z atrapą backendu (``httpx.MockTransport``) zgodną z kontraktem
OpenAPI, która serwuje dane z mocka – dzięki temu te same testy sprawdzają oba adaptery
i pełny roundtrip JSON.
"""

from collections.abc import AsyncIterator
from pathlib import Path
from typing import Any
from urllib.parse import unquote

import httpx
import pytest

from contracts import Profile
from profile_source import (
    ConsentRequiredError,
    HttpProfileSource,
    MockEntry,
    MockProfileSource,
    ProfileNotFoundError,
    ProfileSource,
)
from profile_source.http_source import API_PREFIX, CONSENT_CODE
from profile_source.personas import load_personas

ROOT = Path(__file__).resolve().parents[3]
PERSONAS_DIR = ROOT / "data" / "personas"
BACKEND_URL = "https://backend.test"


def _profile(ref: str, *, consent: bool, partner: dict[str, Any] | None) -> Profile:
    data: dict[str, Any] = {
        "profileId": ref,
        "applicant": {"role": "MOTHER", "insurance": {"source": "ZUS"}},
        "partnerConsent": consent,
        "child": {"source": "USER", "birthDate": "2026-11-12"},
    }
    if partner is not None:
        data["partner"] = partner
    return Profile.model_validate(data)


def build_mock() -> MockProfileSource:
    """Persony T01–T12 + przypadek „zgoda bez danych partnera” spoza person."""
    entries: dict[str, Profile | MockEntry] = {
        p.profile.profile_id: MockEntry(p.profile, p.today) for p in load_personas(PERSONAS_DIR)
    }
    entries["test-consent-no-partner"] = _profile(
        "test-consent-no-partner", consent=True, partner=None
    )
    return MockProfileSource(entries)


def _error(status: int, code: str) -> httpx.Response:
    return httpx.Response(status, json={"code": code, "message": code.lower()})


def fake_backend(mock: MockProfileSource) -> httpx.MockTransport:
    """Atrapa backendu wg ``backend-profile.openapi.json``; dane z mocka."""

    def handle(request: httpx.Request) -> httpx.Response:
        raw = request.url.raw_path.decode().removeprefix(f"{API_PREFIX}/")
        ref, _, suffix = raw.partition("/")
        user_ref = unquote(ref)
        try:
            match suffix:
                case "":
                    body = mock.profile(user_ref).model_dump(mode="json")
                case "partner":
                    body = mock.partner(user_ref).model_dump(mode="json")
                case "stage":
                    body = mock.stage(user_ref).model_dump(mode="json")
                case _:
                    return _error(404, "NOT_FOUND")
        except ProfileNotFoundError:
            return _error(404, "NOT_FOUND")
        except ConsentRequiredError:
            return _error(403, CONSENT_CODE)
        return httpx.Response(200, json=body)

    return httpx.MockTransport(handle)


@pytest.fixture
def mock_source() -> MockProfileSource:
    return build_mock()


@pytest.fixture(params=["mock", "http"])
async def source(
    request: pytest.FixtureRequest, mock_source: MockProfileSource
) -> AsyncIterator[ProfileSource]:
    adapter: ProfileSource
    if request.param == "mock":
        adapter = mock_source
    else:
        client = httpx.AsyncClient(base_url=BACKEND_URL, transport=fake_backend(mock_source))
        adapter = HttpProfileSource(BACKEND_URL, api_key="test-key", client=client)
    yield adapter
    await adapter.aclose()
