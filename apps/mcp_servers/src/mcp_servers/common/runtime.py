"""Wspólne zależności serwerów MCP i ich konstrukcja (z podłączonym strażnikiem)."""

from collections.abc import Callable
from dataclasses import dataclass, field
from datetime import UTC, date, datetime
from zoneinfo import ZoneInfo

from mcp.server.mcpserver import MCPServer

from assistant.rag import KnowledgeBase, SupportOrg
from mcp_servers import __version__
from mcp_servers.common.audit import AuditSink
from mcp_servers.common.auth import TokenSigner
from mcp_servers.common.guard import ToolGuard
from profile_source import ProfileSource

WARSAW = ZoneInfo("Europe/Warsaw")

Clock = Callable[[], datetime]


def utc_now() -> datetime:
    return datetime.now(UTC)


@dataclass(frozen=True, slots=True)
class ServerDeps:
    profile_source: ProfileSource
    signer: TokenSigner
    audit: AuditSink
    clock: Clock = utc_now
    knowledge: KnowledgeBase | None = None
    """Baza wiedzy dla serwera ``wiedza`` (ZUS-35); pozostałe serwery jej nie używają."""
    support_orgs: list[SupportOrg] = field(default_factory=list)

    def today(self) -> date:
        """Data w Polsce wg zegara serwera (logika nie woła ``date.today()``)."""
        return self.clock().astimezone(WARSAW).date()


def create_server(name: str, instructions: str, deps: ServerDeps) -> MCPServer:
    server = MCPServer(name, instructions=instructions, version=__version__)
    server.middleware.append(ToolGuard(server, deps.signer, deps.audit, deps.clock))
    return server
