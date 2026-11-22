"""Błędy źródła profilu (ZUS-30) → jednolite odpowiedzi API, bez szczegółów backendu."""

from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient

from api.main import create_app
from api.services.sessions import InMemorySessionRepository
from api.settings import Settings
from contracts import ParentProfile, Profile, StageInfo
from profile_source import (
    BackendContractError,
    BackendUnavailableError,
    ConfigurationError,
    ConsentRequiredError,
    ProfileNotFoundError,
    ProfileSourceError,
)


class FailingSource:
    def __init__(self, error: ProfileSourceError) -> None:
        self.error = error

    async def get_profile(self, user_ref: str) -> Profile:
        raise self.error

    async def get_partner_profile(self, user_ref: str) -> ParentProfile:
        raise self.error

    async def get_child_stage(self, user_ref: str) -> StageInfo:
        raise self.error

    async def aclose(self) -> None:
        return None


def client_for(error: ProfileSourceError) -> Iterator[TestClient]:
    app = create_app(
        Settings(database_url="postgresql+asyncpg://u:p@127.0.0.1:1/x"),
        profile_source=FailingSource(error),
        sessions=InMemorySessionRepository(),
    )
    with TestClient(app) as client:
        yield client


@pytest.mark.parametrize(
    ("error", "status", "code"),
    [
        (ProfileNotFoundError("u"), 404, "PROFILE_NOT_FOUND"),
        (ConsentRequiredError("u"), 403, "CONSENT_REQUIRED"),
        (BackendUnavailableError("timeout 10.0.0.7", 3), 503, "PROFILE_BACKEND_UNAVAILABLE"),
        (BackendContractError("zły JSON", ("applicant",)), 502, "PROFILE_BACKEND_ERROR"),
        (ConfigurationError("inne"), 502, "PROFILE_BACKEND_ERROR"),
    ],
)
def test_profile_source_errors_are_mapped(
    error: ProfileSourceError, status: int, code: str
) -> None:
    for client in client_for(error):
        response = client.post("/auth/mobywatel", json={"userRef": "u"})
        assert response.status_code == status
        assert response.json()["code"] == code
        assert "10.0.0.7" not in response.text
        assert "applicant" not in response.text
