"""Czat – poziom 2 (ZUS-43): pytanie wolnym tekstem → asystent → odpowiedź, historia sesji.

Asystent ma limit czasu (``CHAT_TIMEOUT_S``): po jego przekroczeniu 504, po błędzie 502 –
w obu przypadkach z propozycją kontaktu z urzędnikiem (``details`` z akcją ESCALATE).
Każda odpowiedź trafia do historii sesji i do analityki (bez treści pytania).
"""

import asyncio
import logging
from datetime import datetime
from typing import Annotated, Any, Final

from fastapi import APIRouter, Depends, Request
from pydantic import Field

from api.db.models import AuthMode, MessageRole
from api.deps import Clock, CurrentSession, get_clock, get_settings
from api.errors import ApiError, ErrorResponse
from api.services.assistant import ChatAssistant
from api.services.conversations import (
    AnalyticsRecord,
    ConversationRepository,
    MessageRecord,
)
from api.services.escalation_rules import escalation_reason
from api.services.sessions import SessionRecord
from api.settings import Settings
from assistant.answer import ChatAnswer
from assistant.orchestrator import ESCALATE_ACTION, ChatContext
from contracts import Action, Profile, Verdict
from contracts._base import ContractModel

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/chat", tags=["chat"], responses={401: {"model": ErrorResponse}})

LEVEL_CHAT: Final = 2
MESSAGE_MAX_LENGTH: Final = 2000
FAILURE_DETAILS: Final = [{"action": ESCALATE_ACTION.model_dump(mode="json")}]
TIMEOUT_MESSAGE: Final = (
    "Asystent nie zdążył odpowiedzieć. Spróbuj ponownie albo przekaż pytanie urzędnikowi ZUS."
)
ERROR_MESSAGE: Final = (
    "Asystent jest chwilowo niedostępny. Spróbuj ponownie albo przekaż pytanie urzędnikowi ZUS."
)


class ChatRequest(ContractModel):
    message: str = Field(min_length=1, max_length=MESSAGE_MAX_LENGTH)


class EscalationProposal(ContractModel):
    """Aktywna propozycja kontaktu z urzędnikiem (§8.1) – szkic: ``POST /escalations/draft``."""

    reason: str
    action: Action = ESCALATE_ACTION


class ChatResponse(ContractModel):
    answer: ChatAnswer
    seq: int
    """Numer odpowiedzi w historii sesji."""
    escalation: EscalationProposal | None = None


class HistoryItem(ContractModel):
    seq: int
    role: MessageRole
    level: int
    content: str
    intent_id: str | None
    card: dict[str, Any] | None
    created_at: datetime


def get_conversations(request: Request) -> ConversationRepository:
    conversations: ConversationRepository = request.app.state.conversations
    return conversations


def get_assistant(request: Request) -> ChatAssistant:
    assistant: ChatAssistant | None = request.app.state.assistant
    if assistant is None:
        raise ApiError(503, "ASSISTANT_UNAVAILABLE", "Czat jest wyłączony (konfiguracja).")
    return assistant


Conversations = Annotated[ConversationRepository, Depends(get_conversations)]
Assistant = Annotated[ChatAssistant, Depends(get_assistant)]
AppClock = Annotated[Clock, Depends(get_clock)]
AppSettings = Annotated[Settings, Depends(get_settings)]


def chat_context(session: SessionRecord) -> ChatContext:
    profile = Profile.model_validate(session.profile) if session.profile is not None else None
    return ChatContext(
        user_ref=session.user_ref,
        session_id=str(session.id),
        profile=profile,
        zus_data=session.auth_mode is AuthMode.MOBYWATEL,
    )


@router.post("", responses={502: {"model": ErrorResponse}, 504: {"model": ErrorResponse}})
async def chat(
    body: ChatRequest,
    session: CurrentSession,
    assistant: Assistant,
    conversations: Conversations,
    clock: AppClock,
    settings: AppSettings,
) -> ChatResponse:
    previous = await conversations.list_messages(session.id)
    await conversations.append_message(
        session.id,
        role=MessageRole.USER,
        level=LEVEL_CHAT,
        content=body.message,
        created_at=clock(),
    )
    try:
        async with asyncio.timeout(settings.chat_timeout_s):
            answer = await assistant.answer(body.message, chat_context(session))
    except TimeoutError:
        await _failure(conversations, session, clock, "CHAT_TIMEOUT", TIMEOUT_MESSAGE)
        raise ApiError(504, "ASSISTANT_TIMEOUT", TIMEOUT_MESSAGE, FAILURE_DETAILS) from None
    except Exception:
        logger.exception("Błąd asystenta w sesji %s", session.id)
        await _failure(conversations, session, clock, "CHAT_ERROR", ERROR_MESSAGE)
        raise ApiError(502, "ASSISTANT_ERROR", ERROR_MESSAGE, FAILURE_DETAILS) from None

    record = await conversations.append_message(
        session.id,
        role=MessageRole.ASSISTANT,
        level=LEVEL_CHAT,
        content=answer.message,
        created_at=clock(),
        intent_id=answer.intent_id,
        card=answer.card.model_dump(mode="json") if answer.card else None,
    )
    await conversations.record_event(
        AnalyticsRecord(
            session_id=session.id,
            level=LEVEL_CHAT,
            event_type=f"CHAT_{answer.kind}",
            intent_id=answer.intent_id,
            verdict=answer.card.verdict.value if answer.card else None,
            payload={
                "generatedBy": answer.generated_by.value,
                "escalationReason": answer.escalation_reason,
                "difficult": answer.difficult,
            },
            occurred_at=clock(),
        )
    )
    reason = escalation_reason(
        answer, body.message, previous_need_info=_last_was_need_info(previous)
    )
    return ChatResponse(
        answer=answer,
        seq=record.seq,
        escalation=EscalationProposal(reason=reason) if reason else None,
    )


def _last_was_need_info(history: list[MessageRecord]) -> bool:
    answers = [m for m in history if m.role is MessageRole.ASSISTANT]
    if not answers or answers[-1].card is None:
        return False
    return bool(answers[-1].card.get("verdict") == Verdict.NEED_INFO.value)


async def _failure(
    conversations: ConversationRepository,
    session: SessionRecord,
    clock: Clock,
    event_type: str,
    message: str,
) -> None:
    await conversations.append_message(
        session.id,
        role=MessageRole.ASSISTANT,
        level=LEVEL_CHAT,
        content=message,
        created_at=clock(),
    )
    await conversations.record_event(
        AnalyticsRecord(
            session_id=session.id,
            level=LEVEL_CHAT,
            event_type=event_type,
            intent_id=None,
            verdict=None,
            payload=None,
            occurred_at=clock(),
        )
    )


@router.get("/history")
async def history(session: CurrentSession, conversations: Conversations) -> list[HistoryItem]:
    """Historia rozmowy tej sesji w kolejności (TA-22)."""
    return [
        HistoryItem(
            seq=m.seq,
            role=m.role,
            level=m.level,
            content=m.content,
            intent_id=m.intent_id,
            card=m.card,
            created_at=m.created_at,
        )
        for m in await conversations.list_messages(session.id)
    ]
