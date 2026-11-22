"""Jednolity format błędów API: ``{"code", "message", "details"}`` (ZUS-40).

Klient nigdy nie dostaje stack trace ani wartości, które wysłał (mogą zawierać dane osobowe).
"""

import logging
from http import HTTPStatus
from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from starlette.exceptions import HTTPException as StarletteHTTPException

from profile_source import (
    BackendContractError,
    BackendUnavailableError,
    ConsentRequiredError,
    ProfileNotFoundError,
    ProfileSourceError,
)

logger = logging.getLogger(__name__)

STATUS_CODES: dict[int, str] = {
    400: "BAD_REQUEST",
    401: "UNAUTHORIZED",
    403: "FORBIDDEN",
    404: "NOT_FOUND",
    405: "METHOD_NOT_ALLOWED",
    409: "CONFLICT",
    422: "VALIDATION_ERROR",
    500: "INTERNAL_ERROR",
    502: "BAD_GATEWAY",
    503: "SERVICE_UNAVAILABLE",
    504: "GATEWAY_TIMEOUT",
}


class ErrorResponse(BaseModel):
    """Treść każdej odpowiedzi błędu."""

    code: str = Field(examples=["NOT_FOUND"])
    message: str
    details: list[dict[str, Any]] = Field(default_factory=list)


class ApiError(Exception):
    """Błąd domenowy zgłaszany przez routery – trafia do klienta w jednolitym formacie."""

    def __init__(
        self,
        status_code: int,
        code: str,
        message: str,
        details: list[dict[str, Any]] | None = None,
        headers: dict[str, str] | None = None,
    ) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.code = code
        self.message = message
        self.details = details or []
        self.headers = headers or {}


def error_response(
    status_code: int, code: str, message: str, details: list[dict[str, Any]] | None = None
) -> JSONResponse:
    body = ErrorResponse(code=code, message=message, details=details or [])
    return JSONResponse(status_code=status_code, content=body.model_dump(mode="json"))


def code_for(status_code: int) -> str:
    return STATUS_CODES.get(status_code) or HTTPStatus(status_code).name


async def _api_error(_: Request, exc: Exception) -> JSONResponse:
    assert isinstance(exc, ApiError)  # noqa: S101 – rejestracja tylko dla ApiError
    response = error_response(exc.status_code, exc.code, exc.message, exc.details)
    response.headers.update(exc.headers)
    return response


#: Błędy źródła profilu (ZUS-30) → odpowiedź API. Szczegóły backendu zostają w logu.
PROFILE_SOURCE_ERRORS: dict[type[ProfileSourceError], tuple[int, str, str]] = {
    ProfileNotFoundError: (404, "PROFILE_NOT_FOUND", "Nie znaleziono profilu użytkownika."),
    ConsentRequiredError: (
        403,
        "CONSENT_REQUIRED",
        "Dane drugiego rodzica są dostępne tylko za jego zgodą.",
    ),
    BackendUnavailableError: (
        503,
        "PROFILE_BACKEND_UNAVAILABLE",
        "System z danymi profilu jest chwilowo niedostępny. Spróbuj ponownie za chwilę.",
    ),
    BackendContractError: (
        502,
        "PROFILE_BACKEND_ERROR",
        "System z danymi profilu zwrócił niepoprawne dane.",
    ),
}


async def _profile_source_error(_: Request, exc: Exception) -> JSONResponse:
    logger.warning("Błąd źródła profilu: %s", exc)
    for error_type, (status_code, code, message) in PROFILE_SOURCE_ERRORS.items():
        if isinstance(exc, error_type):
            return error_response(status_code, code, message)
    return error_response(502, "PROFILE_BACKEND_ERROR", "Błąd systemu z danymi profilu.")


async def _http_error(_: Request, exc: Exception) -> JSONResponse:
    assert isinstance(exc, StarletteHTTPException)  # noqa: S101
    message = exc.detail if isinstance(exc.detail, str) else HTTPStatus(exc.status_code).phrase
    response = error_response(exc.status_code, code_for(exc.status_code), message)
    if exc.headers:
        response.headers.update(exc.headers)
    return response


async def _validation_error(_: Request, exc: Exception) -> JSONResponse:
    assert isinstance(exc, RequestValidationError)  # noqa: S101
    # Bez pola "input" – nie odsyłamy wartości wysłanych przez użytkownika.
    details = [
        {"loc": list(error["loc"]), "msg": error["msg"], "type": error["type"]}
        for error in exc.errors()
    ]
    return error_response(422, "VALIDATION_ERROR", "Niepoprawne dane żądania.", details)


async def _unexpected_error(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Nieobsłużony wyjątek: %s %s", request.method, request.url.path)
    return error_response(500, "INTERNAL_ERROR", "Wystąpił nieoczekiwany błąd. Spróbuj ponownie.")


def install_error_handlers(app: FastAPI) -> None:
    app.add_exception_handler(ApiError, _api_error)
    app.add_exception_handler(ProfileSourceError, _profile_source_error)
    app.add_exception_handler(StarletteHTTPException, _http_error)
    app.add_exception_handler(RequestValidationError, _validation_error)
    app.add_exception_handler(Exception, _unexpected_error)
