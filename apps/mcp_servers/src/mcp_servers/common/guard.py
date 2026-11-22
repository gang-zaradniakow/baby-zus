"""Strażnik wywołań narzędzi: token, walidacja argumentów, zakres użytkownika, audyt.

Działa jako middleware serwera MCP, więc obejmuje każde narzędzie bez powtarzania kodu:

1. token z ``_meta`` (``TOKEN_META_KEY``) → ``Principal``; brak lub zły → ``UNAUTHORIZED``,
2. argumenty sprawdzane schematem narzędzia → ``INVALID_ARGUMENTS`` z nazwami pól (bez
   wartości – to dane użytkownika),
3. ``user_ref`` w argumentach musi być właścicielem tokenu → inaczej ``FORBIDDEN``,
4. każde wywołanie (udane i nieudane) → wpis audytu.
"""

import logging
from collections.abc import Awaitable, Callable, Mapping
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Final

from mcp.server.mcpserver import MCPServer
from mcp_types import CallToolResult
from pydantic import ValidationError

from mcp_servers.common.audit import AuditEntry, AuditSink
from mcp_servers.common.auth import TOKEN_META_KEY, InvalidTokenError, Principal, TokenSigner
from mcp_servers.common.errors import ErrorCode, tool_error

logger = logging.getLogger(__name__)

TOOLS_CALL: Final = "tools/call"
USER_ARGUMENT: Final = "user_ref"

Clock = Callable[[], datetime]
Result = CallToolResult | Mapping[str, Any]


@dataclass(frozen=True, slots=True)
class _Outcome:
    ok: bool
    code: str | None


def _outcome(result: Result) -> _Outcome:
    if isinstance(result, CallToolResult):
        is_error, structured = bool(result.is_error), result.structured_content
    else:
        is_error, structured = bool(result.get("isError")), result.get("structuredContent")
    code = structured.get("code") if is_error and isinstance(structured, Mapping) else None
    return _Outcome(not is_error, code if isinstance(code, str) else None)


class ToolGuard:
    def __init__(
        self, server: MCPServer, signer: TokenSigner, audit: AuditSink, clock: Clock
    ) -> None:
        self._server = server
        self._signer = signer
        self._audit = audit
        self._clock = clock

    async def __call__(self, ctx: Any, call_next: Callable[[Any], Awaitable[Any]]) -> Any:
        if ctx.method != TOOLS_CALL:
            return await call_next(ctx)
        params: Mapping[str, Any] = ctx.params or {}
        name = str(params.get("name", ""))
        arguments = params.get("arguments") or {}
        principal: Principal | None = None
        try:
            principal = self._authenticate(ctx.meta)
            self._check(name, arguments, principal)
        except _RejectedError as rejected:
            result: Result = rejected.result
        else:
            result = await call_next(ctx)
            if not _outcome(result).ok and _outcome(result).code is None:
                # Błąd z warstwy SDK (np. konwersja wyniku) – bez szczegółów dla klienta.
                result = tool_error(ErrorCode.INTERNAL, "Wewnętrzny błąd narzędzia.")
        await self._record(name, principal, _outcome(result))
        return result

    def _authenticate(self, meta: Mapping[str, Any] | None) -> Principal:
        token = (meta or {}).get(TOKEN_META_KEY)
        if not isinstance(token, str) or not token:
            raise _RejectedError(ErrorCode.UNAUTHORIZED, "Brak tokenu dostępu.")
        try:
            return self._signer.verify(token, self._clock())
        except InvalidTokenError:
            raise _RejectedError(ErrorCode.UNAUTHORIZED, "Token dostępu jest nieważny.") from None

    def _check(self, name: str, arguments: Mapping[str, Any], principal: Principal) -> None:
        tool = self._server._tool_manager.get_tool(name)
        if tool is None:
            raise _RejectedError(ErrorCode.UNKNOWN_TOOL, f"Nieznane narzędzie: {name}.")
        try:
            tool.fn_metadata.validate_arguments(dict(arguments))
        except ValidationError as error:
            fields = sorted({".".join(map(str, e["loc"])) or "<root>" for e in error.errors()})
            raise _RejectedError(
                ErrorCode.INVALID_ARGUMENTS,
                "Niepoprawne argumenty narzędzia.",
                {"fields": fields},
            ) from None
        if USER_ARGUMENT in arguments and arguments[USER_ARGUMENT] != principal.user_ref:
            raise _RejectedError(ErrorCode.FORBIDDEN, "Brak dostępu do danych innego użytkownika.")

    async def _record(self, name: str, principal: Principal | None, outcome: _Outcome) -> None:
        entry = AuditEntry(
            occurred_at=self._clock(),
            tool=f"{self._server.name}.{name}",
            outcome="OK" if outcome.ok else "ERROR",
            actor_ref=principal.user_ref if principal else None,
            session_id=principal.session_id if principal else None,
            details={"code": outcome.code} if outcome.code else {},
        )
        try:
            await self._audit.record(entry)
        except Exception:
            # Awaria audytu nie może ujawnić danych ani zablokować odpowiedzi – tylko log.
            logger.exception("Nie zapisano wpisu audytu dla %s", entry.tool)


class _RejectedError(Exception):
    def __init__(
        self, code: ErrorCode, message: str, details: dict[str, Any] | None = None
    ) -> None:
        super().__init__(message)
        self.result = tool_error(code, message, details)
