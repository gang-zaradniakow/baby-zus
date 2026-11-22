"""Serwer ``zus-naleznosci``: zadłużenie składkowe i zaświadczenie (§7, symulacja)."""

import uuid
from datetime import date
from decimal import Decimal

from mcp.server.mcpserver import MCPServer

from contracts import FactSource
from contracts._base import ContractModel
from contracts.types import Money
from mcp_servers.common.errors import handles_errors
from mcp_servers.common.runtime import ServerDeps, create_server

NAME = "zus-naleznosci"


class DebtStatus(ContractModel):
    source: FactSource
    on_date: date
    contribution_debt: Money | None
    """Kwota zaległości; ``null`` – brak informacji w danych sprawy."""
    has_debt: bool | None
    note: str = "Mock: stan zadłużenia z danych sprawy, niezależny od daty."


class DebtCertificate(ContractModel):
    certificate_id: str
    issued_on: date
    has_debt: bool | None
    simulated: bool = True


def build(deps: ServerDeps) -> MCPServer:
    server = create_server(
        NAME, "Zadłużenie składkowe zalogowanego użytkownika (ważne przy JDG i kategorii H).", deps
    )

    async def _debt(user_ref: str) -> tuple[FactSource, Decimal | None]:
        insurance = (await deps.profile_source.get_profile(user_ref)).applicant.insurance
        return insurance.source, insurance.contribution_debt

    @server.tool()
    @handles_errors
    async def get_debt_status(user_ref: str, on_date: date) -> DebtStatus:
        """Zadłużenie składkowe na dzień (np. dzień powstania prawa do zasiłku)."""
        source, debt = await _debt(user_ref)
        return DebtStatus(
            source=source,
            on_date=on_date,
            contribution_debt=debt,
            has_debt=None if debt is None else debt > 0,
        )

    @server.tool()
    @handles_errors
    async def issue_debt_certificate(user_ref: str) -> DebtCertificate:
        """Symulacja wydania zaświadczenia o niezaleganiu w opłacaniu składek."""
        _, debt = await _debt(user_ref)
        return DebtCertificate(
            certificate_id=f"ZAS-SIM-{uuid.uuid4().hex[:10].upper()}",
            issued_on=deps.today(),
            has_debt=None if debt is None else debt > 0,
        )

    return server
