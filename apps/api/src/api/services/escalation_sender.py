"""Wysyłka zaakceptowanej paczki do ZUS przez MCP ``zus-pue`` (symulacja PUE, §8.2)."""

from typing import Final, Protocol

from assistant.escalation import Channel, EscalationPackage
from assistant.tools import ToolClient
from contracts.access_token import Principal

SUBJECT_MAX: Final = 200
MESSAGE_MAX: Final = 4000


class EscalationSender(Protocol):
    async def send(self, principal: Principal, package: EscalationPackage) -> str:
        """Wysyła paczkę i zwraca numer sprawy albo rezerwacji."""
        ...


def message_text(package: EscalationPackage) -> str:
    parts = [
        f"Pytanie: {package.question}",
        f"Streszczenie: {package.summary}",
        f"Powód kontaktu: {package.reason}",
    ]
    if package.missing_or_conflicting:
        parts.append("Brakujące dane: " + "; ".join(package.missing_or_conflicting))
    if package.engine_results:
        parts.append(
            "Wyniki silnika: "
            + "; ".join(f"{r.intent_id} – {r.verdict.value}" for r in package.engine_results)
        )
    return "\n".join(parts)[:MESSAGE_MAX]


class McpEscalationSender:
    def __init__(self, tools: ToolClient) -> None:
        self._tools = tools

    async def send(self, principal: Principal, package: EscalationPackage) -> str:
        if package.channel is Channel.PUE_MESSAGE:
            case = await self._tools.call(
                principal,
                "zus-pue",
                "send_question",
                {
                    "user_ref": principal.user_ref,
                    "subject": f"Asystent: {package.reason}"[:SUBJECT_MAX],
                    "message": message_text(package),
                },
            )
            return str(case["caseId"])
        booking = await self._tools.call(
            principal,
            "zus-pue",
            "book_contact",
            {"user_ref": principal.user_ref, "channel": package.channel.value},
        )
        return str(booking["bookingId"])
