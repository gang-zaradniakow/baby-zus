"""Eskalacja do urzędnika – poziom 3 (ZUS-44, §8).

1. ``POST /escalations/draft`` – szkic paczki §8.2 (streszczenie pisze LLM, walidowane);
   NIC nie jest wysyłane,
2. użytkownik czyta szkic i akceptuje: ``POST /escalations/{id}/confirm`` – dopiero teraz
   paczka idzie do ZUS przez ``zus-pue``; ponowne potwierdzenie zwraca ten sam wynik.
"""

import uuid
from datetime import date
from typing import Annotated, Final

from fastapi import APIRouter, Depends, Request, status
from pydantic import Field, ValidationError

from api.db.models import EscalationChannel, EscalationStatus, MessageRole
from api.deps import Clock, CurrentSession, get_clock, get_profile_source, get_today
from api.errors import ApiError, ErrorResponse
from api.routers.chat import Conversations
from api.services.conversations import AnalyticsRecord, MessageRecord
from api.services.escalation_sender import EscalationSender
from api.services.escalations import EscalationRecord, EscalationRepository
from api.services.sessions import SessionRecord
from assistant.escalation import Channel, ConversationTurn, EscalationPackage, draft_package
from assistant.llm import LLMClient
from contracts import AnswerCard, Profile, StageInfo
from contracts._base import ContractModel
from contracts.access_token import Principal
from profile_source import ProfileSource, ProfileSourceError
from rules_engine.catalog import detect_stage

router = APIRouter(
    prefix="/escalations", tags=["escalations"], responses={401: {"model": ErrorResponse}}
)

LEVEL_ESCALATION: Final = 3
HISTORY_TURNS: Final = 10
USER_REQUEST_REASON: Final = "Użytkownik poprosił o kontakt z urzędnikiem."


class DraftRequest(ContractModel):
    channel: EscalationChannel = EscalationChannel.PUE_MESSAGE
    question: str | None = Field(default=None, min_length=1, max_length=2000)
    """Pytanie własnymi słowami; brak – ostatnie pytanie z czatu."""
    reason: str | None = Field(default=None, min_length=1, max_length=300)


class EscalationView(ContractModel):
    id: str
    status: EscalationStatus
    channel: EscalationChannel
    package: EscalationPackage
    external_case_id: str | None
    """Numer sprawy (PUE) albo rezerwacji – po wysłaniu."""


def get_escalations(request: Request) -> EscalationRepository:
    repository: EscalationRepository = request.app.state.escalations
    return repository


def get_llm(request: Request) -> LLMClient:
    llm: LLMClient | None = request.app.state.llm
    if llm is None:
        raise ApiError(503, "ASSISTANT_UNAVAILABLE", "Eskalacja jest wyłączona (konfiguracja).")
    return llm


def get_sender(request: Request) -> EscalationSender:
    sender: EscalationSender | None = request.app.state.escalation_sender
    if sender is None:
        raise ApiError(503, "ESCALATION_UNAVAILABLE", "Wysyłka do ZUS jest wyłączona.")
    return sender


Escalations = Annotated[EscalationRepository, Depends(get_escalations)]
AppClock = Annotated[Clock, Depends(get_clock)]


def _view(record: EscalationRecord) -> EscalationView:
    return EscalationView(
        id=str(record.id),
        status=record.status,
        channel=record.channel,
        package=EscalationPackage.model_validate(record.package),
        external_case_id=record.external_case_id,
    )


def _cards(history: list[MessageRecord]) -> list[AnswerCard]:
    cards: list[AnswerCard] = []
    for message in history:
        if message.card is not None:
            try:
                cards.append(AnswerCard.model_validate(message.card))
            except ValidationError:
                continue
    return cards


async def _profile(
    session: SessionRecord, source: ProfileSource, today: date
) -> tuple[Profile | None, StageInfo | None]:
    if session.profile is not None:
        profile = Profile.model_validate(session.profile)
        return profile, detect_stage(profile, today).to_contract()
    try:
        return (
            await source.get_profile(session.user_ref),
            await source.get_child_stage(session.user_ref),
        )
    except ProfileSourceError:
        return None, None  # paczka bez profilu – urzędnik dopyta


async def _own(
    escalations: EscalationRepository, escalation_id: str, session: SessionRecord
) -> EscalationRecord:
    try:
        record = await escalations.get(uuid.UUID(escalation_id))
    except ValueError:
        record = None
    if record is None or record.session_id != session.id:
        raise ApiError(404, "ESCALATION_NOT_FOUND", "Nie ma takiej eskalacji.")
    return record


@router.post("/draft", status_code=status.HTTP_201_CREATED)
async def draft(
    body: DraftRequest,
    session: CurrentSession,
    conversations: Conversations,
    escalations: Escalations,
    clock: AppClock,
    today: Annotated[date, Depends(get_today)],
    source: Annotated[ProfileSource, Depends(get_profile_source)],
    llm: Annotated[LLMClient, Depends(get_llm)],
) -> EscalationView:
    """Szkic paczki dla urzędnika – nic nie jest wysyłane bez ``confirm``."""
    history = await conversations.list_messages(session.id)
    questions = [m.content for m in history if m.role is MessageRole.USER]
    question = body.question or (questions[-1] if questions else None)
    if question is None:
        raise ApiError(422, "QUESTION_REQUIRED", "Podaj pytanie, które mamy przekazać urzędnikowi.")
    profile, stage = await _profile(session, source, today)
    package = await draft_package(
        llm,
        question=question,
        reason=body.reason or USER_REQUEST_REASON,
        channel=Channel(body.channel.value),
        conversation=[
            ConversationTurn(role=m.role.value, text=m.content) for m in history[-HISTORY_TURNS:]
        ],
        profile=profile,
        stage=stage,
        cards=_cards(history),
    )
    record = await escalations.create(
        session_id=session.id,
        channel=body.channel,
        summary=package.summary,
        package=package.model_dump(mode="json"),
        created_at=clock(),
    )
    await conversations.record_event(
        AnalyticsRecord(session.id, LEVEL_ESCALATION, "ESCALATION_DRAFT", None, None, None, clock())
    )
    return _view(record)


@router.get("/{escalation_id}", responses={404: {"model": ErrorResponse}})
async def get_escalation(
    escalation_id: str, session: CurrentSession, escalations: Escalations
) -> EscalationView:
    return _view(await _own(escalations, escalation_id, session))


@router.post(
    "/{escalation_id}/confirm",
    responses={404: {"model": ErrorResponse}, 409: {"model": ErrorResponse}},
)
async def confirm(
    escalation_id: str,
    session: CurrentSession,
    escalations: Escalations,
    conversations: Conversations,
    clock: AppClock,
    sender: Annotated[EscalationSender, Depends(get_sender)],
) -> EscalationView:
    """Akceptacja użytkownika → wysyłka do ZUS. Ponowne wywołanie zwraca ten sam wynik."""
    record = await _own(escalations, escalation_id, session)
    if record.status is EscalationStatus.SENT:
        return _view(record)
    if not await escalations.claim(record.id, clock()):
        raise ApiError(409, "ESCALATION_IN_PROGRESS", "Wysyłka tej eskalacji już trwa.")
    package = EscalationPackage.model_validate(record.package)
    try:
        case_id = await sender.send(Principal(session.user_ref, str(session.id)), package)
    except Exception:
        await escalations.release(record.id)
        raise ApiError(
            502, "ESCALATION_SEND_FAILED", "Nie udało się wysłać – spróbuj ponownie."
        ) from None
    await escalations.mark_sent(record.id, case_id)
    await conversations.record_event(
        AnalyticsRecord(session.id, LEVEL_ESCALATION, "ESCALATION_SENT", None, None, None, clock())
    )
    sent = await escalations.get(record.id)
    assert sent is not None  # noqa: S101 – właśnie zapisana
    return _view(sent)
