"""Serwer ``zus-ezla``: zwolnienia lekarskie e-ZLA z kodami (w tym „B” – ciąża) (§7)."""

from mcp.server.mcpserver import MCPServer

from contracts import FactSource, SickLeave
from contracts._base import ContractModel
from mcp_servers.common.errors import handles_errors
from mcp_servers.common.runtime import ServerDeps, create_server

NAME = "zus-ezla"


class SickLeaves(ContractModel):
    source: FactSource
    sick_leaves: list[SickLeave]


def build(deps: ServerDeps) -> MCPServer:
    server = create_server(
        NAME, "Zwolnienia lekarskie e-ZLA zalogowanego użytkownika (okresy i kody).", deps
    )

    @server.tool()
    @handles_errors
    async def list_sick_leaves(user_ref: str) -> SickLeaves:
        """e-ZLA z okresami i kodami literowymi; kod B = niezdolność w okresie ciąży."""
        insurance = (await deps.profile_source.get_profile(user_ref)).applicant.insurance
        return SickLeaves(source=insurance.source, sick_leaves=insurance.sick_leaves)

    return server
