"""Asystent poziomu 2 w API (ZUS-43): port i budowa orkiestratora z konfiguracji.

Testy podmieniają asystenta przez ``create_app(assistant=...)`` albo ``dependency_overrides``;
produkcja buduje ``Orchestrator`` z ``LLM_*``, ``MCP_*`` i walidatorem liczb.
"""

import logging
from collections.abc import Callable
from datetime import date, datetime
from typing import Protocol
from zoneinfo import ZoneInfo

from api.services.escalation_sender import EscalationSender, McpEscalationSender
from assistant.answer import ChatAnswer
from assistant.llm import LLMClient, create_llm_client
from assistant.orchestrator import ChatContext, Orchestrator
from assistant.tools import create_tool_client
from assistant.validation import NumberValidator

logger = logging.getLogger(__name__)
WARSAW = ZoneInfo("Europe/Warsaw")


class ChatAssistant(Protocol):
    async def answer(self, question: str, context: ChatContext) -> ChatAnswer: ...


def build_assistant(clock: Callable[[], datetime]) -> ChatAssistant | None:
    """Orkiestrator z konfiguracji; ``None`` (i wpis w logu), gdy konfiguracja jest niepełna."""

    def today() -> date:
        return clock().astimezone(WARSAW).date()

    try:
        return Orchestrator(
            create_llm_client(), create_tool_client(), NumberValidator(), today=today
        )
    except ValueError as error:
        logger.error("Asystent poziomu 2 wyłączony – zła konfiguracja: %s", error)
        return None


def build_llm() -> LLMClient | None:
    """Klient LLM do streszczeń eskalacji (paczka i tak powstaje z szablonu, gdy model padnie)."""
    try:
        return create_llm_client()
    except ValueError as error:
        logger.error("LLM wyłączony – zła konfiguracja: %s", error)
        return None


def build_escalation_sender() -> EscalationSender | None:
    try:
        return McpEscalationSender(create_tool_client())
    except ValueError as error:
        logger.error("Wysyłka eskalacji wyłączona – zła konfiguracja: %s", error)
        return None
