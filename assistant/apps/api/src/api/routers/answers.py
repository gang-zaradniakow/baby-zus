"""Odpowiedź poziomu 1: intencja z listy + profil sesji → karta z silnika reguł (ZUS-42).

Liczby daje wyłącznie ``rules_engine.evaluate`` (bez LLM). Gdy silnik nie ma reguły
(``Unsupported``), API nie zgaduje – kieruje do czatu (poziom 2) albo urzędnika (ESCALATE).
"""

from typing import Literal

from fastapi import APIRouter
from pydantic import Field

from api.deps import CurrentProfile, CurrentSession, Sessions, Today
from api.errors import ApiError, ErrorResponse
from api.services.profile_patch import ProfilePatch, save_patch
from contracts import Action, ActionType, AnswerCard, LegalRef
from contracts._base import ContractModel
from rules_engine.catalog import INTENTS_BY_ID
from rules_engine.evaluate import evaluate

router = APIRouter(prefix="/answers", tags=["answers"])

ESCALATE_LABEL = "Zapytaj urzędnika ZUS"
UNSUPPORTED_MESSAGE = (
    "Na to pytanie nie ma gotowego wyliczenia. Zadaj je w czacie z asystentem "
    "albo przekaż sprawę urzędnikowi ZUS."
)


class AnswerRequest(ContractModel):
    intent_id: str = Field(min_length=1, max_length=64, examples=["B.01_wysokosc_macierzynskiego"])
    supplements: ProfilePatch | None = None
    """Uzupełnienia braków (jak PATCH /me/profile) – zapisywane w profilu sesji."""


class UnsupportedAnswer(ContractModel):
    """Silnik nie odpowiada deterministycznie – dalej poziom 2 (czat) albo urzędnik."""

    intent_id: str
    reason: str
    message: str = UNSUPPORTED_MESSAGE
    legal_basis: list[LegalRef]
    actions: list[Action]


class AnswerResponse(ContractModel):
    """``kind`` mówi, które pole jest wypełnione: ``card`` albo ``unsupported``."""

    kind: Literal["CARD", "UNSUPPORTED"]
    card: AnswerCard | None = None
    unsupported: UnsupportedAnswer | None = None


@router.post("", responses={404: {"model": ErrorResponse}, 422: {"model": ErrorResponse}})
async def answer(
    body: AnswerRequest,
    session: CurrentSession,
    profile: CurrentProfile,
    sessions: Sessions,
    today: Today,
) -> AnswerResponse:
    if body.intent_id not in INTENTS_BY_ID:
        raise ApiError(404, "INTENT_NOT_FOUND", f"Nie ma pytania {body.intent_id} w katalogu.")
    if body.supplements is not None:
        profile = await save_patch(sessions, session, profile, body.supplements)

    result = evaluate(body.intent_id, profile, today)
    if isinstance(result, AnswerCard):
        return AnswerResponse(kind="CARD", card=result)
    return AnswerResponse(
        kind="UNSUPPORTED",
        unsupported=UnsupportedAnswer(
            intent_id=result.intent_id,
            reason=result.reason,
            legal_basis=result.legal_basis,
            actions=[Action(type=ActionType.ESCALATE, label=ESCALATE_LABEL, ref=result.intent_id)],
        ),
    )
