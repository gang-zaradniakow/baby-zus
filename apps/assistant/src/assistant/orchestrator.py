"""Orkiestrator poziomu 2 (ZUS-52): kroki stałe, LLM nie wybiera narzędzi.

1. rozpoznanie intencji (``classify``) – niska pewność albo awaria modelu → eskalacja,
2. pytanie spoza katalogu → baza wiedzy (``wiedza.search_law`` / ``search_guides``),
3. pytanie z katalogu → dane z ZUS przez MCP wg kategorii (plan poniżej), potem
   ``kalkulator.check_eligibility`` – liczby wyłącznie z silnika,
4. LLM pisze tylko ``summary`` karty; walidator sprawdza tekst (do 2 ponowień),
   a przy odrzuceniu albo awarii modelu zostaje szablon silnika (``generatedBy=RULES``),
5. błąd narzędzia → eskalacja z powodem – nigdy zmyślona karta.

Ochrona (ZUS-54): pytanie jest pseudonimizowane na starcie (PESEL, adresy, kontakty), a każde
wywołanie modelu przechodzi przez ``PrivateLLMClient``. Guardrails odpowiadają bez modelu
na pytania medyczne i o „optymalizację”; pytania spoza tematu odsyłają na zus.pl. W sytuacji
trudnej (§9.3) odpowiedź zaczyna się od kondolencji, ton jest sprawdzany, a do odpowiedzi
dołączamy organizacje wsparcia.

Sesja z formularza (bez danych ZUS) pomija narzędzia ZUS; kalkulator dostaje profil sesji.
Dane wyciągnięte z pytania (np. „mam bliźnięta”) uzupełniają profil jako deklaracja (USER).
"""

import logging
from collections.abc import Callable
from dataclasses import dataclass
from datetime import date
from typing import Any, Final

from assistant.answer import ChatAnswer, Source, SupportOrgRef
from assistant.guardrails import (
    DIFFICULT_OPENING,
    GUARD_MESSAGES,
    RISK_INTENT,
    Difficult,
    Guard,
    difficult_situation,
    guard_before_classification,
    off_topic,
    possible_injection,
)
from assistant.intent import Classification, ExtractedFacts, classify
from assistant.knowledge import NO_ANSWER_REASON, answer_from_sources
from assistant.llm.base import LLMClient, LLMError, Message
from assistant.privacy import PrivateLLMClient, Pseudonymizer
from assistant.prompts.summary import SummaryOut, retry_message, summary_messages, tone_problems
from assistant.tools import ToolCallError, ToolClient
from assistant.validation import SummaryValidator
from contracts import (
    OUT_OF_CATALOG,
    Action,
    ActionType,
    AnswerCard,
    FactSource,
    GeneratedBy,
    Profile,
    Verdict,
)
from contracts.access_token import Principal
from rules_engine.catalog import INTENTS_BY_ID

logger = logging.getLogger(__name__)

ToolRef = tuple[str, str]

#: Dane z ZUS pobierane przed wyliczeniem – wg kategorii katalogu (TL-13).
DATA_PLAN: Final[dict[str, tuple[ToolRef, ...]]] = {
    "A": (("zus-ubezpieczenia", "get_insurance_periods"),),
    "B": (("zus-ubezpieczenia", "get_contribution_base"),),
    "G": (("zus-ubezpieczenia", "get_payer_info"),),
    "H": (("zus-ubezpieczenia", "get_insurance_periods"), ("zus-naleznosci", "get_debt_status")),
}
#: Intencje zależne od zwolnień lekarskich – dodatkowo e-ZLA.
SICK_LEAVE_INTENTS: Final = frozenset(
    {
        "A.02_chorobowy_w_ciazy",
        "A.03_swiadczenie_rehabilitacyjne",
        "B.02_wysokosc_chorobowego_w_ciazy",
        "H.03_przerwa_w_ubezpieczeniu",
    }
)
PROFILE_TOOL: Final = ("profil", "get_profile")
CALCULATOR_TOOL: Final = ("kalkulator", "check_eligibility")
SEARCH_TOOLS: Final = (("wiedza", "search_law"), ("wiedza", "search_guides"))
SUPPORT_TOOL: Final = ("wiedza", "list_support_orgs")

ESCALATE_ACTION: Final = Action(type=ActionType.ESCALATE, label="Zapytaj urzędnika ZUS")
ESCALATE_MESSAGE: Final = (
    "Nie potrafię rzetelnie odpowiedzieć na to pytanie. Mogę przekazać je urzędnikowi ZUS "
    "razem ze streszczeniem rozmowy – zanim cokolwiek wyślę, pokażę Ci treść do akceptacji."
)
TOOL_ERROR_REASON: Final = "Nie udało się pobrać danych potrzebnych do odpowiedzi."


@dataclass(frozen=True, slots=True)
class ChatContext:
    user_ref: str
    session_id: str | None = None
    profile: Profile | None = None
    """Profil sesji (formularz, uzupełnienia); ``None`` – profil z ZUS przez MCP."""
    zus_data: bool = True
    """Czy użytkownik ma dane w ZUS (logowanie mObywatel); formularz – ``False``."""

    @property
    def principal(self) -> Principal:
        return Principal(self.user_ref, self.session_id)


def data_plan(intent_id: str) -> tuple[ToolRef, ...]:
    plan = DATA_PLAN.get(intent_id[0], ())
    if intent_id in SICK_LEAVE_INTENTS:
        plan = (*plan, ("zus-ezla", "list_sick_leaves"))
    return plan


def with_facts(profile: Profile, facts: ExtractedFacts) -> Profile:
    """Profil uzupełniony danymi z pytania; zmienione dane dziecka mają źródło USER."""
    patch = facts.to_patch().get("child")
    if not patch:
        return profile
    child = {**profile.child.model_dump(mode="json"), **patch, "source": FactSource.USER.value}
    return Profile.model_validate({**profile.model_dump(mode="json"), "child": child})


class Orchestrator:
    def __init__(
        self,
        llm: LLMClient,
        tools: ToolClient,
        validator: SummaryValidator,
        *,
        today: Callable[[], date],
        summary_retries: int = 2,
        rag_limit: int = 3,
        min_source_score: float = 0.3,
    ) -> None:
        # Każde wywołanie modelu – także podsumowania i ponowienia – przechodzi pseudonimizację.
        self._llm = PrivateLLMClient(llm)
        self._tools = tools
        self._validator = validator
        self._today = today
        self._summary_retries = summary_retries
        self._rag_limit = rag_limit
        self._min_source_score = min_source_score

    async def answer(self, question: str, context: ChatContext) -> ChatAnswer:
        # Dalej (model, narzędzia, baza wiedzy) idzie wyłącznie wersja z pseudonimami.
        question = Pseudonymizer().mask(question)
        if possible_injection(question):
            logger.info("Pytanie zawiera tekst wyglądający na polecenie – traktowane jako dane.")
        guard = guard_before_classification(question)
        if guard is not None:
            return self._refusal(guard)

        classification = await classify(self._llm, question)
        difficult = difficult_situation(context.profile, question)
        if classification.escalate:
            answer = self._escalate(classification.intent_id, classification.reason, classification)
        elif not classification.in_catalog:
            if off_topic(question):
                return self._refusal(Guard.OFF_TOPIC)
            answer = await self._knowledge(question, context, OUT_OF_CATALOG)
        else:
            try:
                answer, difficult = await self._catalog(question, context, classification)
            except ToolCallError:
                answer = self._escalate(classification.intent_id, TOOL_ERROR_REASON, classification)
        return await self._comfort(answer, difficult, context)

    # --- ścieżka katalogu --------------------------------------------------------------

    async def _catalog(
        self, question: str, context: ChatContext, classification: Classification
    ) -> tuple[ChatAnswer, Difficult | None]:
        intent_id = classification.intent_id
        principal = context.principal
        profile = context.profile
        if context.zus_data:
            fetched = await self._call(principal, PROFILE_TOOL, {"user_ref": context.user_ref})
            if profile is None:
                profile = Profile.model_validate(fetched["profile"])
            for ref in data_plan(intent_id):
                await self._call(principal, ref, self._arguments(ref, context))
        arguments: dict[str, Any] = {"user_ref": context.user_ref, "intent_id": intent_id}
        if profile is not None:
            enriched = with_facts(profile, classification.extracted)
            if enriched is not profile or context.profile is not None:
                arguments["profile"] = enriched.model_dump(mode="json")
        result = await self._call(principal, CALCULATOR_TOOL, arguments)
        difficult = difficult_situation(profile, question)

        if result["kind"] != "CARD":
            return await self._knowledge(question, context, intent_id), difficult
        card = await self._explain(
            AnswerCard.model_validate(result["card"]), question, difficult=difficult is not None
        )
        answer = ChatAnswer(
            kind="CARD",
            intent_id=intent_id,
            message=card.summary,
            card=card,
            actions=card.actions,
            level1_intent_id=intent_id,
            generated_by=card.generated_by,
        )
        return answer, difficult

    def _arguments(self, ref: ToolRef, context: ChatContext) -> dict[str, Any]:
        arguments: dict[str, Any] = {"user_ref": context.user_ref}
        if ref == ("zus-naleznosci", "get_debt_status"):
            arguments["on_date"] = self._today().isoformat()
        return arguments

    async def _call(
        self, principal: Principal, ref: ToolRef, arguments: dict[str, Any]
    ) -> dict[str, Any]:
        server, tool = ref
        return await self._tools.call(principal, server, tool, arguments)

    async def _explain(
        self, card: AnswerCard, question: str, *, difficult: bool = False
    ) -> AnswerCard:
        """LLM pisze tylko ``summary``; reszta karty (liczby, werdykt) zostaje z silnika."""
        if card.verdict is Verdict.NEED_INFO:
            return card  # lista braków z silnika jest precyzyjniejsza niż parafraza
        messages: list[Message] = summary_messages(card, question, difficult=difficult)
        for _ in range(self._summary_retries + 1):
            try:
                out = await self._llm.complete_json(messages, SummaryOut, max_tokens=400)
            except LLMError:
                return card
            problems = self._validator.problems(out.summary, card)
            if difficult:
                problems += tone_problems(out.summary)
            if not problems:
                return card.model_copy(
                    update={"summary": out.summary, "generated_by": GeneratedBy.LLM_EXPLAINED}
                )
            messages = [*messages, Message("assistant", out.summary), retry_message(problems)]
        return card

    # --- baza wiedzy i eskalacja ---------------------------------------------------------

    async def _knowledge(self, question: str, context: ChatContext, intent_id: str) -> ChatAnswer:
        sources: list[Source] = []
        try:
            for ref in SEARCH_TOOLS:
                found = await self._call(
                    context.principal, ref, {"query": question, "limit": self._rag_limit}
                )
                sources += [
                    Source(
                        title=item["title"],
                        url=item["url"],
                        excerpt=item["text"],
                        act=item.get("act"),
                        article=item.get("article"),
                    )
                    for item in found["results"]
                    if item["score"] >= self._min_source_score
                ]
        except ToolCallError:
            return self._escalate(intent_id, TOOL_ERROR_REASON, None)
        if not sources:
            return self._escalate(intent_id, "Brak źródła w bazie wiedzy.", None)
        result = await answer_from_sources(self._llm, question, sources)
        if not result.answerable:
            return self._escalate(intent_id, NO_ANSWER_REASON, None)
        return ChatAnswer(
            kind="KNOWLEDGE",
            intent_id=intent_id,
            message=result.message,
            sources=result.sources,
            legal_basis=result.legal_basis,
            generated_by=GeneratedBy.LLM_EXPLAINED if result.llm_written else GeneratedBy.RULES,
            actions=[ESCALATE_ACTION],
            level1_intent_id=intent_id if intent_id in INTENTS_BY_ID else None,
        )

    async def _comfort(
        self, answer: ChatAnswer, difficult: Difficult | None, context: ChatContext
    ) -> ChatAnswer:
        """Sytuacja trudna: kondolencje na początku i organizacje wsparcia (§9.3)."""
        if difficult is None:
            return answer
        try:
            found = await self._call(
                context.principal, SUPPORT_TOOL, {"situation": difficult.situation.value}
            )
            orgs = [
                SupportOrgRef(name=o["name"], description=o["description"], url=o.get("url"))
                for o in found["organizations"]
            ]
        except ToolCallError:
            orgs = []  # brak listy nie może zablokować odpowiedzi
        return answer.model_copy(
            update={
                "message": f"{DIFFICULT_OPENING}\n\n{answer.message}",
                "difficult": True,
                "support_orgs": orgs,
            }
        )

    @staticmethod
    def _refusal(guard: Guard) -> ChatAnswer:
        risk = guard is Guard.OPTIMIZATION
        return ChatAnswer(
            kind="REFUSAL",
            intent_id=RISK_INTENT if risk else OUT_OF_CATALOG,
            message=GUARD_MESSAGES[guard],
            level1_intent_id=RISK_INTENT if risk else None,
        )

    @staticmethod
    def _escalate(
        intent_id: str, reason: str | None, classification: Classification | None
    ) -> ChatAnswer:
        return ChatAnswer(
            kind="ESCALATE",
            intent_id=intent_id,
            message=ESCALATE_MESSAGE,
            actions=[ESCALATE_ACTION],
            escalation_reason=reason,
            suggestions=list(classification.suggestions) if classification else [],
        )
