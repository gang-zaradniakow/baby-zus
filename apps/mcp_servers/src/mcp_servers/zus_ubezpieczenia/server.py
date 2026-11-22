"""Serwer ``zus-ubezpieczenia``: tytuły i okresy ubezpieczenia, przychody, płatnik (§7)."""

from mcp.server.mcpserver import MCPServer

from contracts import FactSource, InsurancePeriod, MonthlySalary, PayerInfo
from contracts._base import ContractModel
from contracts.types import Rate
from mcp_servers.common.errors import handles_errors
from mcp_servers.common.runtime import ServerDeps, create_server

NAME = "zus-ubezpieczenia"


class InsurancePeriods(ContractModel):
    source: FactSource
    periods: list[InsurancePeriod]


class ContributionData(ContractModel):
    """Dane do podstawy wymiaru – samą podstawę liczy serwer ``kalkulator`` (silnik)."""

    source: FactSource
    salaries: list[MonthlySalary]
    deduction_rate: Rate | None
    """Procent potrąconych składek ze sprawy (U7); ``null`` – domyślny z parametrów silnika."""


class PayerData(ContractModel):
    source: FactSource
    payer: PayerInfo | None
    """Liczba ubezpieczonych na 30 listopada; ``null`` – brak danych płatnika."""


def build(deps: ServerDeps) -> MCPServer:
    server = create_server(
        NAME,
        "Dane z ZUS o ubezpieczeniu zalogowanego użytkownika: okresy, przychody, płatnik.",
        deps,
    )

    @server.tool()
    @handles_errors
    async def get_insurance_periods(user_ref: str) -> InsurancePeriods:
        """Tytuły ubezpieczenia (umowa o pracę, zlecenie, działalność) i okresy podlegania."""
        insurance = (await deps.profile_source.get_profile(user_ref)).applicant.insurance
        return InsurancePeriods(source=insurance.source, periods=insurance.periods)

    @server.tool()
    @handles_errors
    async def get_contribution_base(user_ref: str) -> ContributionData:
        """Miesięczne przychody brutto i procent potrąconych składek (do podstawy wymiaru)."""
        insurance = (await deps.profile_source.get_profile(user_ref)).applicant.insurance
        return ContributionData(
            source=insurance.source,
            salaries=insurance.salaries,
            deduction_rate=insurance.deduction_rate,
        )

    @server.tool()
    @handles_errors
    async def get_payer_info(user_ref: str) -> PayerData:
        """Liczba ubezpieczonych u płatnika na 30 listopada (kto wypłaca zasiłek, art. 61)."""
        insurance = (await deps.profile_source.get_profile(user_ref)).applicant.insurance
        return PayerData(source=insurance.source, payer=insurance.payer)

    return server
