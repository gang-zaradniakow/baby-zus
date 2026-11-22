"""Serwer ``profil``: profil sprawy z etapem oraz dane drugiego rodzica (tylko za zgodą) (§7).

``update_profile`` z §7 nie jest tu udostępniony: profil zmienia użytkownik przez API
(``PATCH /me/profile``), a źródło profilu (``ProfileSource``) jest tylko do odczytu.
"""

from mcp.server.mcpserver import MCPServer

from contracts import ParentProfile, Profile, StageInfo
from contracts._base import ContractModel
from mcp_servers.common.errors import handles_errors
from mcp_servers.common.runtime import ServerDeps, create_server

NAME = "profil"


class ProfileWithStage(ContractModel):
    profile: Profile
    stage: StageInfo


def build(deps: ServerDeps) -> MCPServer:
    server = create_server(
        NAME, "Profil zalogowanego użytkownika: etap, dziecko, zdarzenia, plan urlopu.", deps
    )

    @server.tool()
    @handles_errors
    async def get_profile(user_ref: str) -> ProfileWithStage:
        """Profil sprawy (dziecko, PDP, liczba dzieci, zdarzenia) z etapem E0–E3 i flagami."""
        profile = await deps.profile_source.get_profile(user_ref)
        stage = await deps.profile_source.get_child_stage(user_ref)
        return ProfileWithStage(profile=profile, stage=stage)

    @server.tool()
    @handles_errors
    async def get_partner_profile(user_ref: str) -> ParentProfile:
        """Dane drugiego rodzica – tylko gdy wyraził zgodę (inaczej CONSENT_REQUIRED)."""
        return await deps.profile_source.get_partner_profile(user_ref)

    return server
