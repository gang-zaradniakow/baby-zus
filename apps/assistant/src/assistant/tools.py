"""Wywołania narzędzi MCP przez orkiestrator (ZUS-52) – LLM nigdy nie wybiera narzędzi.

``McpToolClient`` łączy się z serwerem MCP w procesie (``MCPServer`` – testy, demo) albo po
HTTP (``http://…/<serwer>/mcp``). Każde wywołanie niesie krótkotrwały token dostępu
(``contracts.access_token``) w ``_meta`` i ma limit czasu; błąd narzędzia to ``ToolCallError``
z kodem z serwera (``FORBIDDEN``, ``NOT_FOUND``…) albo ``TIMEOUT`` / ``UNAVAILABLE``.
"""

import asyncio
import os
from collections.abc import Callable, Mapping
from dataclasses import dataclass, field
from datetime import UTC, datetime, timedelta
from typing import Any, Final, Protocol, cast

from mcp import Client
from mcp.server.mcpserver import MCPServer

from contracts.access_token import TOKEN_META_KEY, Principal, TokenSigner

TOKEN_TTL: Final = timedelta(minutes=2)
TIMEOUT_CODE: Final = "TIMEOUT"
UNAVAILABLE_CODE: Final = "UNAVAILABLE"

Clock = Callable[[], datetime]
Target = MCPServer | str


class ToolCallError(Exception):
    def __init__(self, server: str, tool: str, code: str, message: str = "") -> None:
        super().__init__(f"{server}.{tool}: {code} {message}".strip())
        self.server = server
        self.tool = tool
        self.code = code


@dataclass(frozen=True, slots=True)
class ToolCall:
    server: str
    tool: str
    arguments: dict[str, Any]


class ToolClient(Protocol):
    async def call(
        self, principal: Principal, server: str, tool: str, arguments: dict[str, Any]
    ) -> dict[str, Any]: ...


def _utc_now() -> datetime:
    return datetime.now(UTC)


class McpToolClient:
    def __init__(
        self,
        endpoints: Mapping[str, Target],
        signer: TokenSigner,
        *,
        timeout_s: float = 10.0,
        clock: Clock = _utc_now,
    ) -> None:
        self._endpoints = dict(endpoints)
        self._signer = signer
        self._timeout_s = timeout_s
        self._clock = clock

    async def call(
        self, principal: Principal, server: str, tool: str, arguments: dict[str, Any]
    ) -> dict[str, Any]:
        target = self._endpoints.get(server)
        if target is None:
            raise ToolCallError(server, tool, "UNKNOWN_SERVER")
        token = self._signer.issue(principal, self._clock() + TOKEN_TTL)
        meta = cast("Any", {TOKEN_META_KEY: token})
        try:
            async with asyncio.timeout(self._timeout_s), Client(target) as client:
                result = await client.call_tool(tool, arguments, meta=meta)
        except TimeoutError:
            raise ToolCallError(server, tool, TIMEOUT_CODE, "przekroczono czas") from None
        except Exception:
            raise ToolCallError(server, tool, UNAVAILABLE_CODE, "serwer niedostępny") from None
        content = result.structured_content or {}
        if result.is_error:
            raise ToolCallError(
                server, tool, str(content.get("code", "ERROR")), str(content.get("message", ""))
            )
        return dict(content)


def create_tool_client(env: Mapping[str, str] | None = None) -> McpToolClient:
    """Klient HTTP: ``MCP_BASE_URL`` (np. http://mcp_servers:8000), ``MCP_TOKEN_SECRET``."""
    env = os.environ if env is None else env
    base = env.get("MCP_BASE_URL", "http://localhost:8001").rstrip("/")
    servers = [
        "zus-ubezpieczenia",
        "zus-ezla",
        "zus-naleznosci",
        "profil",
        "kalkulator",
        "wiedza",
        "zus-pue",
        "dokumenty",
        "usc",
    ]
    return McpToolClient(
        {name: f"{base}/{name}/mcp" for name in servers},
        TokenSigner(env.get("MCP_TOKEN_SECRET", "")),
        timeout_s=float(env.get("MCP_TIMEOUT_S", "10") or 10),
    )


@dataclass
class FakeToolClient:
    """Atrapa do testów orkiestratora: odpowiedzi wg ``(serwer, narzędzie)``, zapis wywołań.

    Wartością może być słownik, ``ToolCallError`` albo funkcja ``(argumenty) -> słownik``.
    """

    responses: dict[tuple[str, str], Any] = field(default_factory=dict)
    calls: list[ToolCall] = field(default_factory=list)
    principals: list[Principal] = field(default_factory=list)

    async def call(
        self, principal: Principal, server: str, tool: str, arguments: dict[str, Any]
    ) -> dict[str, Any]:
        self.calls.append(ToolCall(server, tool, arguments))
        self.principals.append(principal)
        response = self.responses.get((server, tool))
        if response is None:
            raise ToolCallError(server, tool, "NOT_CONFIGURED")
        if isinstance(response, ToolCallError):
            raise response
        if callable(response):
            return dict(response(arguments))
        return dict(response)

    @property
    def sequence(self) -> list[str]:
        return [f"{c.server}.{c.tool}" for c in self.calls]
