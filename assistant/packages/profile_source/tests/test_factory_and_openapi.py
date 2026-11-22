"""Fabryka adapterów (TP-08), zegar mocka i kontrakt OpenAPI backendu."""

import json
from datetime import date
from pathlib import Path

import pytest

from contracts import Profile, Stage
from profile_source import (
    ConfigurationError,
    HttpProfileSource,
    MockProfileSource,
    create_profile_source,
    openapi,
)
from profile_source.mock import warsaw_today

ROOT = Path(__file__).resolve().parents[3]
PERSONAS_DIR = ROOT / "data" / "personas"
OPENAPI_FILE = ROOT / "docs" / "contracts" / "backend-profile.openapi.json"


async def test_tp08_mock_is_default(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.chdir(ROOT)  # domyślny PERSONAS_DIR jest względny
    for env in ({}, {"PROFILE_SOURCE": ""}, {"PROFILE_SOURCE": " Mock "}):
        source = create_profile_source(env)
        assert isinstance(source, MockProfileSource)
        assert "persona-t01" in source.user_refs


async def test_tp08_http_from_env() -> None:
    source = create_profile_source(
        {
            "PROFILE_SOURCE": " HTTP ",
            "BACKEND_URL": "https://backend.test",
            "BACKEND_API_KEY": "k",
            "BACKEND_TIMEOUT_S": "2.5",
            "BACKEND_MAX_ATTEMPTS": "5",
        }
    )
    assert isinstance(source, HttpProfileSource)
    assert source._max_attempts == 5
    assert source._client.timeout.read == 2.5
    assert source._client.headers["Authorization"] == "Bearer k"
    await source.aclose()


async def test_tp08_http_defaults() -> None:
    source = create_profile_source({"PROFILE_SOURCE": "http", "BACKEND_URL": "http://b:8080"})
    assert isinstance(source, HttpProfileSource)
    assert source._max_attempts == 3
    assert source._client.timeout.read == 5.0
    await source.aclose()


@pytest.mark.parametrize(
    ("env", "message"),
    [
        ({"PROFILE_SOURCE": "ldap"}, "dozwolone: mock, http"),
        ({"PERSONAS_DIR": "brak/takiego/katalogu"}, "PERSONAS_DIR"),
        ({"PROFILE_SOURCE": "http"}, "BACKEND_URL"),
        ({"PROFILE_SOURCE": "http", "BACKEND_URL": "ftp://b"}, "BACKEND_URL"),
        ({"PROFILE_SOURCE": "http", "BACKEND_URL": "http://b", "BACKEND_TIMEOUT_S": "x"}, "liczbą"),
        (
            {"PROFILE_SOURCE": "http", "BACKEND_URL": "http://b", "BACKEND_TIMEOUT_S": "0"},
            "dodatnia",
        ),
        (
            {"PROFILE_SOURCE": "http", "BACKEND_URL": "http://b", "BACKEND_MAX_ATTEMPTS": "1.5"},
            "BACKEND_MAX_ATTEMPTS",
        ),
        (
            {"PROFILE_SOURCE": "http", "BACKEND_URL": "http://b", "BACKEND_MAX_ATTEMPTS": "-1"},
            "dodatnia",
        ),
    ],
)
def test_tp08_bad_configuration_fails_at_start(env: dict[str, str], message: str) -> None:
    with pytest.raises(ConfigurationError, match=message) as error:
        create_profile_source(env)
    assert isinstance(error.value, ValueError)


def test_tp08_reads_os_environ(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("PROFILE_SOURCE", "mock")
    monkeypatch.setenv("PERSONAS_DIR", str(PERSONAS_DIR))
    assert isinstance(create_profile_source(), MockProfileSource)


@pytest.mark.parametrize(
    ("today", "stage"), [(date(2026, 11, 1), Stage.E0), (date(2027, 1, 20), Stage.E1)]
)
async def test_mock_stage_uses_clock_when_entry_has_no_today(today: date, stage: Stage) -> None:
    profile = Profile.model_validate(
        {
            "profileId": "p",
            "applicant": {"role": "MOTHER", "insurance": {"source": "USER"}},
            "child": {"source": "USER", "expectedBirthDate": "2027-03-01"},
        }
    )
    source = MockProfileSource({"p": profile}, clock=lambda: today)
    assert (await source.get_child_stage("p")).stage is stage


def test_warsaw_today_is_a_date() -> None:
    assert isinstance(warsaw_today(), date)


def test_openapi_file_is_current() -> None:
    assert openapi.main(["--out", str(OPENAPI_FILE), "--check"]) == 0


def test_openapi_structure() -> None:
    document = openapi.build_openapi()
    assert document["openapi"] == "3.1.0"
    assert set(document["paths"]) == {
        "/v1/profiles/{userRef}",
        "/v1/profiles/{userRef}/partner",
        "/v1/profiles/{userRef}/stage",
    }
    schemas = document["components"]["schemas"]
    assert {"Profile", "ParentProfile", "StageInfo", "ErrorBody"} <= set(schemas)
    assert "#/$defs/" not in openapi.render(document)
    partner = document["paths"]["/v1/profiles/{userRef}/partner"]["get"]["responses"]
    assert set(partner) == {"200", "403", "404", "429", "503"}
    assert document["components"]["securitySchemes"]["bearer"]["scheme"] == "bearer"


def test_openapi_cli_write_and_check(tmp_path: Path) -> None:
    out = tmp_path / "sub" / "backend.json"
    assert openapi.main(["--out", str(out), "--check"]) == 1  # brak pliku
    assert openapi.main(["--out", str(out)]) == 0
    assert json.loads(out.read_text(encoding="utf-8"))["openapi"] == "3.1.0"
    assert openapi.main(["--out", str(out), "--check"]) == 0
    assert openapi.main(["--out", str(out)]) == 0  # bez zmian
    out.write_text("{}", encoding="utf-8")
    assert openapi.main(["--out", str(out), "--check"]) == 1
