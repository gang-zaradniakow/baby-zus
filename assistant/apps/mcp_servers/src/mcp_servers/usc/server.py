"""Serwer ``usc`` (symulacja): wniosek o odpis aktu urodzenia (§7, etap E3)."""

from datetime import date
from enum import StrEnum
from typing import Final

from mcp.server.mcpserver import MCPServer

from contracts._base import ContractModel
from mcp_servers.common.errors import ErrorCode, ToolFailureError, handles_errors
from mcp_servers.common.runtime import ServerDeps, create_server

NAME = "usc"
ZUS_NOTE: Final = (
    "Gdy zasiłek wypłaca ZUS, odpis aktu urodzenia ZUS pobiera sam – nie musisz go dołączać."
)


class CertificateKind(StrEnum):
    FULL = "FULL"
    """Odpis zupełny."""
    SHORT = "SHORT"
    """Odpis skrócony."""


class CertificateRequest(ContractModel):
    request_id: str
    kind: CertificateKind
    submitted_on: date
    note: str = ZUS_NOTE
    simulated: bool = True


def build(deps: ServerDeps) -> MCPServer:
    server = create_server(NAME, "Symulacja USC: wniosek o odpis aktu urodzenia dziecka.", deps)
    counter = {"request": 0}

    @server.tool()
    @handles_errors
    async def request_birth_certificate(user_ref: str, kind: CertificateKind) -> CertificateRequest:
        """Złóż wniosek o odpis aktu urodzenia (zupełny albo skrócony) – symulacja."""
        profile = await deps.profile_source.get_profile(user_ref)
        if profile.child.birth_date is None:
            raise ToolFailureError(
                ErrorCode.NOT_APPLICABLE,
                "Odpis aktu urodzenia można zamówić dopiero po zarejestrowaniu urodzenia.",
            )
        counter["request"] += 1
        return CertificateRequest(
            request_id=f"USC-SIM-{counter['request']:06d}", kind=kind, submitted_on=deps.today()
        )

    return server
