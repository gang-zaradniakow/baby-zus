"""Serwer ``kalkulator``: cienka warstwa na ``rules_engine.evaluate`` (ZUS-33, §7).

Liczby daje wyłącznie silnik reguł – serwer niczego nie przelicza ani nie zaokrągla, więc
wynik przez MCP jest identyczny z wywołaniem biblioteki. Dla intencji bez reguły zwraca
ustrukturyzowane ``UNSUPPORTED`` (poziom 2 albo urzędnik), a nie zgadnięty werdykt.

Profil: z ``ProfileSource`` po ``user_ref`` albo podany w argumencie ``profile`` przez
orkiestratora (sesja z formularza, profil po uzupełnieniach). Podany profil musi należeć
do właściciela tokenu (``profileId == user_ref``; strażnik sprawdza ``user_ref``).
"""

from typing import Final, Literal

from mcp.server.mcpserver import MCPServer
from pydantic import Field

from contracts import AnswerCard, LegalRef, Profile
from contracts._base import ContractModel
from mcp_servers.common.errors import ErrorCode, ToolFailureError, handles_errors
from mcp_servers.common.runtime import ServerDeps, create_server
from rules_engine.catalog import INTENTS_BY_ID
from rules_engine.evaluate import evaluate

NAME = "kalkulator"

#: Narzędzia ``calc_*`` z §7 → intencja katalogu, którą liczą.
CALC_INTENTS: Final = {
    "calc_maternity": "B.01_wysokosc_macierzynskiego",
    "calc_sickness": "B.02_wysokosc_chorobowego_w_ciazy",
    "calc_parental_split": "D.04_wplyw_podzialu_na_kwote",
    "calc_part_time": "E.03_wplyw_pracy_na_kwote",
    "calc_adoption": "F.04_rodzice_adopcyjni",
}

ProfileArg = Profile | None


class UnsupportedResult(ContractModel):
    intent_id: str
    reason: str
    legal_basis: list[LegalRef]


class CalculatorResult(ContractModel):
    """``kind`` mówi, które pole jest wypełnione – jak odpowiedź ``POST /answers`` w API."""

    kind: Literal["CARD", "UNSUPPORTED"]
    card: AnswerCard | None = None
    unsupported: UnsupportedResult | None = None


def build(deps: ServerDeps) -> MCPServer:
    server = create_server(
        NAME,
        "Wyliczenia silnika reguł (karta odpowiedzi §5.1). Liczby wyłącznie z tych narzędzi.",
        deps,
    )

    async def run(intent_id: str, user_ref: str, profile: ProfileArg) -> CalculatorResult:
        if intent_id not in INTENTS_BY_ID:
            raise ToolFailureError(ErrorCode.NOT_FOUND, f"Nie ma intencji {intent_id} w katalogu.")
        if profile is None:
            profile = await deps.profile_source.get_profile(user_ref)
        elif profile.profile_id != user_ref:
            raise ToolFailureError(ErrorCode.FORBIDDEN, "Profil należy do innego użytkownika.")
        result = evaluate(intent_id, profile, deps.today())
        if isinstance(result, AnswerCard):
            return CalculatorResult(kind="CARD", card=result)
        return CalculatorResult(
            kind="UNSUPPORTED",
            unsupported=UnsupportedResult(
                intent_id=result.intent_id, reason=result.reason, legal_basis=result.legal_basis
            ),
        )

    profile_field = Field(
        default=None,
        description="Profil sesji (formularz, uzupełnienia); brak – profil z ZUS po user_ref.",
    )

    @server.tool()
    @handles_errors
    async def check_eligibility(
        user_ref: str, intent_id: str, profile: ProfileArg = profile_field
    ) -> CalculatorResult:
        """Karta silnika dla dowolnej intencji katalogu A–H (werdykt, fakty, wyliczenie)."""
        return await run(intent_id, user_ref, profile)

    def register(tool_name: str, intent_id: str, title: str) -> None:
        async def calc(user_ref: str, profile: ProfileArg = profile_field) -> CalculatorResult:
            return await run(intent_id, user_ref, profile)

        calc.__name__ = tool_name
        calc.__doc__ = f"{title} – karta silnika dla intencji {intent_id}."
        server.tool(name=tool_name)(handles_errors(calc))

    register("calc_maternity", CALC_INTENTS["calc_maternity"], "Wysokość zasiłku macierzyńskiego")
    register("calc_sickness", CALC_INTENTS["calc_sickness"], "Zasiłek chorobowy w ciąży")
    register(
        "calc_parental_split",
        CALC_INTENTS["calc_parental_split"],
        "Wpływ podziału urlopu rodzicielskiego na kwotę",
    )
    register("calc_part_time", CALC_INTENTS["calc_part_time"], "Wpływ pracy na zasiłek")
    register("calc_adoption", CALC_INTENTS["calc_adoption"], "Świadczenia rodziców adopcyjnych")
    return server
