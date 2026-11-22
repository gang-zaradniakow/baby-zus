"""Serwer ``zus-pue`` (symulacja PUE/eZUS): wiadomość do ZUS, status spraw, e-wizyta (§7, §8.2).

Stan symulacji żyje w pamięci instancji serwera. Każdy użytkownik widzi tylko swoje sprawy
(strażnik sprawdza ``user_ref``). Treść wiadomości nie trafia do audytu – tylko nazwa narzędzia.
Eskalacja z API (ZUS-44) wysyła paczkę przez ``send_question`` po akceptacji użytkownika.
"""

from collections import defaultdict
from datetime import date, datetime, time, timedelta
from enum import StrEnum
from typing import Annotated, Final

from mcp.server.mcpserver import MCPServer
from pydantic import Field

from contracts._base import ContractModel
from mcp_servers.common.errors import ErrorCode, ToolFailureError, handles_errors
from mcp_servers.common.runtime import WARSAW, ServerDeps, create_server

NAME = "zus-pue"
SLOT_TIME: Final = time(10, 0)
SATURDAY: Final = 5


class CaseStatus(StrEnum):
    SENT = "SENT"
    """Wysłana – czeka na odpowiedź urzędnika."""


class ContactChannel(StrEnum):
    EVISIT = "EVISIT"
    """e-wizyta (wideorozmowa z urzędnikiem)."""
    CALLBACK = "CALLBACK"
    """Oddzwonienie z Centrum Obsługi Telefonicznej."""
    BRANCH_VISIT = "BRANCH_VISIT"
    """Wizyta w placówce ZUS."""


class Case(ContractModel):
    case_id: str
    subject: str
    status: CaseStatus
    created_on: date
    simulated: bool = True


class CaseList(ContractModel):
    cases: list[Case]


class Booking(ContractModel):
    booking_id: str
    channel: ContactChannel
    slot_start: datetime
    """Termin w strefie Europe/Warsaw."""
    simulated: bool = True


def first_working_day(after: date, not_before: date | None) -> date:
    """Najbliższy dzień roboczy (pn–pt) po ``after`` i nie wcześniej niż ``not_before``."""
    day = max(after + timedelta(days=1), not_before or after)
    while day.weekday() >= SATURDAY:
        day += timedelta(days=1)
    return day


def build(deps: ServerDeps) -> MCPServer:
    server = create_server(
        NAME, "Symulacja PUE/eZUS: wiadomości do ZUS, status spraw, umawianie kontaktu.", deps
    )
    cases: dict[str, list[Case]] = defaultdict(list)
    counters = {"case": 0, "booking": 0}

    def next_id(kind: str, prefix: str) -> str:
        counters[kind] += 1
        return f"{prefix}-SIM-{counters[kind]:06d}"

    @server.tool()
    @handles_errors
    async def send_question(
        user_ref: str,
        subject: Annotated[str, Field(min_length=3, max_length=200)],
        message: Annotated[str, Field(min_length=1, max_length=4000)],
    ) -> Case:
        """Wyślij wiadomość do ZUS (symulacja) – zwraca numer sprawy."""
        case = Case(
            case_id=next_id("case", "SPR"),
            subject=subject,
            status=CaseStatus.SENT,
            created_on=deps.today(),
        )
        cases[user_ref].append(case)
        return case

    @server.tool()
    @handles_errors
    async def get_case_status(user_ref: str, case_id: str | None = None) -> CaseList:
        """Status spraw użytkownika; z ``case_id`` – jednej sprawy."""
        mine = cases[user_ref]
        if case_id is None:
            return CaseList(cases=mine)
        found = [case for case in mine if case.case_id == case_id]
        if not found:
            raise ToolFailureError(ErrorCode.NOT_FOUND, "Nie ma takiej sprawy.")
        return CaseList(cases=found)

    @server.tool()
    @handles_errors
    async def book_contact(
        user_ref: str, channel: ContactChannel, preferred_date: date | None = None
    ) -> Booking:
        """Umów e-wizytę, oddzwonienie albo wizytę w placówce – najbliższy dzień roboczy, 10:00."""
        day = first_working_day(deps.today(), preferred_date)
        return Booking(
            booking_id=next_id("booking", "WIZ"),
            channel=channel,
            slot_start=datetime.combine(day, SLOT_TIME, tzinfo=WARSAW),
        )

    return server
