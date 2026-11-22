"""TA-04: jednolity format błędów ``{code, message, details}`` dla 404, 405, 422, 500."""

from typing import Any

import pytest
from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient
from pydantic import BaseModel

from api.errors import ApiError, code_for
from api.main import create_app
from api.settings import Settings


class Payload(BaseModel):
    name: str
    count: int


def build_app() -> FastAPI:
    app = create_app(Settings(database_url="postgresql+asyncpg://u:p@127.0.0.1:1/x"))

    @app.post("/echo")
    async def echo(payload: Payload) -> Payload:
        return payload

    @app.get("/boom")
    async def boom() -> None:
        raise RuntimeError("sekret w stack trace")

    @app.get("/auth")
    async def auth() -> None:
        raise HTTPException(401, "Brak tokenu", headers={"WWW-Authenticate": "Bearer"})

    @app.get("/teapot")
    async def teapot() -> None:
        raise HTTPException(418, detail={"nie": "tekst"})

    @app.get("/conflict")
    async def conflict() -> None:
        raise ApiError(409, "ALREADY_SENT", "Eskalacja już wysłana.", [{"id": "e1"}])

    return app


@pytest.fixture
def client() -> TestClient:
    return TestClient(build_app(), raise_server_exceptions=False)


def assert_error(body: dict[str, Any], code: str) -> None:
    assert set(body) == {"code", "message", "details"}
    assert body["code"] == code
    assert body["message"]


def test_ta04_unknown_route_is_404(client: TestClient) -> None:
    response = client.get("/nie-ma")
    assert response.status_code == 404
    assert_error(response.json(), "NOT_FOUND")


def test_ta04_wrong_method_is_405(client: TestClient) -> None:
    response = client.delete("/health")
    assert response.status_code == 405
    assert_error(response.json(), "METHOD_NOT_ALLOWED")


def test_ta04_validation_error_is_422_without_input_echo(client: TestClient) -> None:
    response = client.post("/echo", json={"name": "PESEL 90010112345", "count": "dużo"})
    assert response.status_code == 422
    body = response.json()
    assert_error(body, "VALIDATION_ERROR")
    assert [d["loc"] for d in body["details"]] == [["body", "count"]]
    assert body["details"][0]["type"] == "int_parsing"
    assert "90010112345" not in response.text
    assert "dużo" not in response.text


def test_ta04_unexpected_exception_is_500_without_details(client: TestClient) -> None:
    response = client.get("/boom")
    assert response.status_code == 500
    assert_error(response.json(), "INTERNAL_ERROR")
    assert "sekret" not in response.text
    assert "Traceback" not in response.text


def test_http_exception_keeps_headers(client: TestClient) -> None:
    response = client.get("/auth")
    assert response.status_code == 401
    assert response.headers["WWW-Authenticate"] == "Bearer"
    assert response.json()["message"] == "Brak tokenu"


def test_http_exception_with_non_text_detail(client: TestClient) -> None:
    response = client.get("/teapot")
    assert response.json() == {"code": "IM_A_TEAPOT", "message": "I'm a Teapot", "details": []}


def test_api_error_details(client: TestClient) -> None:
    response = client.get("/conflict")
    assert response.status_code == 409
    assert response.json()["details"] == [{"id": "e1"}]


def test_code_for_known_and_unknown_status() -> None:
    assert code_for(404) == "NOT_FOUND"
    assert code_for(418) == "IM_A_TEAPOT"
