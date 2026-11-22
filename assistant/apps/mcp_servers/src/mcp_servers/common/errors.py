"""Błędy narzędzi MCP: ``isError`` + ``structuredContent = {code, message}``.

Kody są stałe, żeby orkiestrator (ZUS-52) mógł na nie reagować (NEED_INFO, eskalacja),
a komunikat nigdy nie zawiera stack trace ani danych z argumentów.
"""

import functools
import json
import logging
from collections.abc import Awaitable, Callable
from enum import StrEnum
from typing import Any

from mcp_types import CallToolResult, TextContent

from profile_source import (
    BackendContractError,
    BackendUnavailableError,
    ConsentRequiredError,
    ProfileNotFoundError,
    ProfileSourceError,
)

logger = logging.getLogger(__name__)


class ErrorCode(StrEnum):
    UNAUTHORIZED = "UNAUTHORIZED"
    FORBIDDEN = "FORBIDDEN"
    INVALID_ARGUMENTS = "INVALID_ARGUMENTS"
    UNKNOWN_TOOL = "UNKNOWN_TOOL"
    NOT_FOUND = "NOT_FOUND"
    CONSENT_REQUIRED = "CONSENT_REQUIRED"
    NOT_APPLICABLE = "NOT_APPLICABLE"
    """Czynność nie ma sensu na tym etapie (np. odpis aktu przed porodem)."""
    BACKEND_UNAVAILABLE = "BACKEND_UNAVAILABLE"
    INTERNAL = "INTERNAL"


class ToolFailureError(Exception):
    """Przewidziany błąd narzędzia – trafia do klienta jako kod i komunikat."""

    def __init__(self, code: ErrorCode, message: str) -> None:
        super().__init__(message)
        self.code = code
        self.message = message


def tool_error(
    code: ErrorCode, message: str, details: dict[str, Any] | None = None
) -> CallToolResult:
    body: dict[str, Any] = {"code": code.value, "message": message}
    if details:
        body["details"] = details
    return CallToolResult(
        content=[TextContent(type="text", text=json.dumps(body, ensure_ascii=False))],
        structured_content=body,
        is_error=True,
    )


def _from_profile_source(error: ProfileSourceError) -> ToolFailureError:
    match error:
        case ProfileNotFoundError():
            return ToolFailureError(ErrorCode.NOT_FOUND, "Brak danych użytkownika.")
        case ConsentRequiredError():
            return ToolFailureError(
                ErrorCode.CONSENT_REQUIRED, "Dane drugiego rodzica są dostępne tylko za jego zgodą."
            )
        case BackendUnavailableError() | BackendContractError():
            return ToolFailureError(
                ErrorCode.BACKEND_UNAVAILABLE, "Źródło danych jest niedostępne."
            )
        case _:
            return ToolFailureError(ErrorCode.INTERNAL, "Błąd źródła danych.")


def handles_errors[**P, R](fn: Callable[P, Awaitable[R]]) -> Callable[P, Awaitable[R]]:
    """Zamienia wyjątki narzędzia na wynik ``isError`` z kodem (bez stack trace).

    Sygnatura i adnotacje zostają (``functools.wraps``), więc SDK buduje z nich schematy.
    """

    @functools.wraps(fn)
    async def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
        try:
            return await fn(*args, **kwargs)
        except ToolFailureError as failure:
            return tool_error(failure.code, failure.message)  # type: ignore[return-value]
        except ProfileSourceError as error:
            mapped = _from_profile_source(error)
            return tool_error(mapped.code, mapped.message)  # type: ignore[return-value]
        except Exception:
            logger.exception("Nieoczekiwany błąd narzędzia %s", fn.__name__)
            return tool_error(  # type: ignore[return-value]
                ErrorCode.INTERNAL, "Wewnętrzny błąd narzędzia. Spróbuj ponownie."
            )

    return wrapper
