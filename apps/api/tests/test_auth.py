"""ZUS-41: logowanie symulowane mObywatel i tryb bez logowania (TA-05…TA-09)."""

from collections.abc import Callable
from datetime import UTC
from pathlib import Path
from typing import Any

import pytest
from fastapi.testclient import TestClient

from api.deps import utc_now
from api.testing import FakeClock
from contracts import FactSource, Profile
from profile_source import MockProfileSource

PERSONAS_DIR = Path(__file__).resolve().parents[3] / "data" / "personas"
Login = Callable[..., dict[str, str]]

FORM: dict[str, Any] = {
    "applicant": {
        "role": "MOTHER",
        "insurance": {
            "periods": [{"title": "EMPLOYMENT", "sickness": "MANDATORY", "dateFrom": "2023-01-02"}],
            "salaries": [{"month": "2026-10", "gross": "6000.00"}],
        },
    },
    "partner": {"role": "FATHER", "insurance": {"periods": []}},
    "child": {"expectedBirthDate": "2027-03-01", "childrenCount": 2},
}


def anonymous(client: TestClient, form: dict[str, Any] = FORM) -> dict[str, str]:
    response = client.post("/auth/anonymous", json=form)
    assert response.status_code == 201, response.text
    return {"Authorization": f"Bearer {response.json()['token']}"}


def test_ta05_mobywatel_login_returns_session_token(client: TestClient, clock: FakeClock) -> None:
    response = client.post("/auth/mobywatel", json={"userRef": "persona-t01"})
    assert response.status_code == 201
    body = response.json()
    assert set(body) == {"token", "tokenType", "expiresAt", "authMode"}
    assert body["tokenType"] == "Bearer"
    assert body["authMode"] == "MOBYWATEL"
    assert body["expiresAt"] == "2026-11-22T09:30:00Z"
    assert len(body["token"]) >= 40


def test_ta05_profile_from_profile_source(client: TestClient, login: Login) -> None:
    response = client.get("/me/profile", headers=login("persona-t01"))
    assert response.status_code == 200
    expected = MockProfileSource.from_personas(PERSONAS_DIR).profile("persona-t01")
    assert Profile.model_validate(response.json()) == expected


def test_ta05_unknown_user_cannot_log_in(client: TestClient) -> None:
    response = client.post("/auth/mobywatel", json={"userRef": "persona-t99"})
    assert response.status_code == 404
    assert response.json()["code"] == "PROFILE_NOT_FOUND"


@pytest.mark.parametrize("headers", [{}, {"Authorization": "Basic abc"}])
def test_ta06_no_token_is_401(client: TestClient, headers: dict[str, str]) -> None:
    response = client.get("/me/profile", headers=headers)
    assert response.status_code == 401
    assert response.json()["code"] == "UNAUTHORIZED"
    assert response.headers["WWW-Authenticate"] == "Bearer"


def test_ta06_unknown_token_is_401(client: TestClient) -> None:
    response = client.get("/me/profile", headers={"Authorization": "Bearer zmyslony"})
    assert response.status_code == 401
    assert response.json()["code"] == "INVALID_TOKEN"


def test_ta07_token_after_ttl_is_401(client: TestClient, clock: FakeClock, login: Login) -> None:
    headers = login()
    clock.advance(minutes=29)
    assert client.get("/me/profile", headers=headers).status_code == 200
    clock.advance(minutes=1)
    response = client.get("/me/profile", headers=headers)
    assert response.status_code == 401
    assert response.json()["code"] == "SESSION_EXPIRED"


def test_logout_revokes_session(client: TestClient, login: Login) -> None:
    headers = login()
    assert client.post("/auth/logout", headers=headers).status_code == 204
    response = client.get("/me/profile", headers=headers)
    assert response.json()["code"] == "SESSION_EXPIRED"


def test_ta08_form_gives_profile_with_user_source(client: TestClient) -> None:
    response = client.get("/me/profile", headers=anonymous(client))
    assert response.status_code == 200
    profile = Profile.model_validate(response.json())
    assert profile.profile_id.startswith("anon-")
    assert profile.applicant.insurance.source is FactSource.USER
    assert profile.child.source is FactSource.USER
    assert profile.partner is not None
    assert profile.partner.insurance.source is FactSource.USER
    assert profile.partner_consent is False
    assert profile.child.children_count == 2


def test_ta08_both_modes_give_the_same_profile_contract(client: TestClient, login: Login) -> None:
    by_login = client.get("/me/profile", headers=login()).json()
    by_form = client.get("/me/profile", headers=anonymous(client)).json()
    assert set(by_login) == set(by_form)
    assert Profile.model_validate(by_login).applicant.insurance.source is FactSource.ZUS
    assert Profile.model_validate(by_form).applicant.insurance.source is FactSource.USER


def test_ta08_each_form_session_gets_own_pseudonym(client: TestClient) -> None:
    first = client.get("/me/profile", headers=anonymous(client)).json()["profileId"]
    second = client.get("/me/profile", headers=anonymous(client)).json()["profileId"]
    assert first != second


@pytest.mark.parametrize(
    ("form", "field"),
    [
        ({"applicant": {"role": "MOTHER"}}, "child"),
        ({**FORM, "child": {"source": "ZUS"}}, "source"),
        ({**FORM, "profileId": "persona-t01"}, "profileId"),
        ({**FORM, "child": {"childrenCount": 0}}, "childrenCount"),
        ({**FORM, "applicant": {"role": "GRANDMA"}}, "role"),
        (
            {
                **FORM,
                "applicant": {
                    "role": "MOTHER",
                    "insurance": {
                        "periods": [
                            {
                                "title": "EMPLOYMENT",
                                "sickness": "MANDATORY",
                                "dateFrom": "2026-05-01",
                                "dateTo": "2026-01-01",
                                "endReason": "OTHER",
                            }
                        ]
                    },
                },
            },
            "periods",
        ),
    ],
)
def test_ta09_invalid_form_is_422(client: TestClient, form: dict[str, Any], field: str) -> None:
    response = client.post("/auth/anonymous", json=form)
    assert response.status_code == 422
    body = response.json()
    assert body["code"] == "VALIDATION_ERROR"
    assert any(field in [str(part) for part in d["loc"]] for d in body["details"]), body


def test_default_clock_is_timezone_aware_utc() -> None:
    now = utc_now()
    assert now.tzinfo is UTC
