"""Wynik silnika → karta odpowiedzi ``AnswerCard`` (ZUS-19, §5 i §5.1).

Karta z silnika ma zawsze ``generatedBy = RULES``, ``engineVersion`` zestawu parametrów,
co najmniej jedną podstawę prawną z linkiem i 1–3 akcje. Teksty są szablonowe – poziom 2
może je przeredagować (LLM), ale liczby i podstawy prawne zostają z silnika.
"""

from collections.abc import Sequence
from dataclasses import dataclass
from typing import Final

from contracts import (
    Action,
    ActionType,
    AnswerCard,
    Calculation,
    Category,
    Fact,
    GeneratedBy,
    MissingField,
    Verdict,
)
from contracts.answer import SUMMARY_MAX_LENGTH
from rules_engine.catalog import FIELD_QUESTIONS, get_intent
from rules_engine.eligibility.decision import Decision
from rules_engine.legal import intent_basis, legal_refs
from rules_engine.outcomes import NeedInfo
from rules_engine.params import LegalBasis, ParamSet

ESCALATE: Final = Action(type=ActionType.ESCALATE, label="Zapytaj urzędnika")
FILL_MISSING: Final = Action(type=ActionType.FORM, label="Uzupełnij dane", ref="profile")
MAX_ACTIONS: Final = 3

#: Główne akcje dla kategorii katalogu (przy werdykcie YES/NO); ESCALATE dochodzi zawsze.
CATEGORY_ACTIONS: Final[dict[Category, tuple[Action, ...]]] = {
    Category.ELIGIBILITY: (
        Action(type=ActionType.FORM, label="Sprawdź dokumenty", ref="G.01_jakie_dokumenty"),
        Action(
            type=ActionType.SIMULATE, label="Policz zasiłek", ref="B.01_wysokosc_macierzynskiego"
        ),
    ),
    Category.AMOUNTS: (
        Action(type=ActionType.SIMULATE, label="Porównaj warianty", ref="B.04_warianty_urlopu"),
        Action(type=ActionType.FORM, label="Wypełnij wniosek", ref="ZAM"),
    ),
    Category.LEAVE: (
        Action(
            type=ActionType.SIMULATE, label="Zaplanuj urlop", ref="D.02_podzial_rodzicielskiego"
        ),
        Action(type=ActionType.FORM, label="Wniosek o urlop", ref="G.08_wniosek_o_urlop"),
    ),
    Category.OTHER_PARENT: (
        Action(
            type=ActionType.SIMULATE,
            label="Zmień podział urlopu",
            ref="D.02_podzial_rodzicielskiego",
        ),
        Action(type=ActionType.SIMULATE, label="Policz kwoty", ref="D.04_wplyw_podzialu_na_kwote"),
    ),
    Category.WORK: (
        Action(type=ActionType.SIMULATE, label="Przelicz z pracą", ref="E.03_wplyw_pracy_na_kwote"),
        Action(type=ActionType.FORM, label="Wniosek o urlop", ref="G.08_wniosek_o_urlop"),
    ),
    Category.SPECIAL: (
        Action(type=ActionType.FORM, label="Sprawdź dokumenty", ref="G.01_jakie_dokumenty"),
        Action(
            type=ActionType.SIMULATE, label="Policz zasiłek", ref="B.01_wysokosc_macierzynskiego"
        ),
    ),
    Category.DOCUMENTS: (
        Action(type=ActionType.FORM, label="Wypełnij wniosek", ref="ZAM"),
        Action(type=ActionType.SIMULATE, label="Kto wypłaci zasiłek", ref="G.05_kto_wyplaca"),
    ),
    Category.RISKS: (
        Action(
            type=ActionType.SIMULATE,
            label="Sprawdź uprawnienia",
            ref="A.01_prawo_do_macierzynskiego",
        ),
    ),
}


@dataclass(frozen=True, slots=True)
class EngineAnswer:
    """Wynik reguły gotowy do karty: decyzja + opcjonalne wyliczenie (typy K i S)."""

    decision: Decision
    calculation: Calculation | None = None
    actions: tuple[Action, ...] | None = None
    """Akcje zamiast domyślnych dla kategorii (ESCALATE i tak dochodzi na końcu)."""


def clip(text: str, limit: int = SUMMARY_MAX_LENGTH) -> str:
    return text if len(text) <= limit else text[: limit - 1].rstrip() + "…"


def missing_fields(paths: Sequence[str]) -> list[MissingField]:
    """Braki z pytaniami do użytkownika (ścieżka bez pytania w katalogu = błąd silnika)."""
    return [MissingField(field=path, question=FIELD_QUESTIONS[path]) for path in paths]


def default_actions(intent_id: str, verdict: Verdict) -> tuple[Action, ...]:
    if verdict is Verdict.NEED_INFO:
        return (FILL_MISSING,)
    category = get_intent(intent_id).category
    return tuple(a for a in CATEGORY_ACTIONS[category] if a.ref != intent_id)


def _actions(intent_id: str, verdict: Verdict, chosen: tuple[Action, ...] | None) -> list[Action]:
    primary = default_actions(intent_id, verdict) if chosen is None else chosen
    return [*primary[: MAX_ACTIONS - 1], ESCALATE]


def build_card(
    intent_id: str,
    answer: EngineAnswer | Decision,
    params: ParamSet,
    *,
    extra_basis: Sequence[LegalBasis] = (),
) -> AnswerCard:
    """Karta z decyzji silnika. Brak podstawy w decyzji → domyślna podstawa intencji."""
    if isinstance(answer, Decision):
        answer = EngineAnswer(answer)
    decision = answer.decision
    bases = (*decision.legal_basis, *extra_basis) or intent_basis(intent_id)
    need_info = decision.verdict is Verdict.NEED_INFO
    calculation = None if need_info else answer.calculation
    warnings = list(decision.warnings)
    if calculation is None:  # bez bloku 4 założenia idą do uwag
        warnings.extend(decision.assumptions)
    return AnswerCard(
        intent_id=intent_id,
        verdict=decision.verdict,
        summary=clip(decision.summary),
        facts=list(decision.facts),
        calculation=calculation,
        missing=missing_fields(decision.missing) if need_info else [],
        legal_basis=legal_refs(bases),
        warnings=warnings,
        alternatives=list(decision.alternatives),
        actions=_actions(intent_id, decision.verdict, answer.actions),
        engine_version=params.version_id,
        generated_by=GeneratedBy.RULES,
    )


def need_info_decision(outcome: NeedInfo, intent_id: str, facts: Sequence[Fact] = ()) -> Decision:
    """``NeedInfo`` z kalkulatora jako decyzja NEED_INFO z podstawą intencji."""
    return Decision(
        verdict=Verdict.NEED_INFO,
        summary=outcome.reason,
        missing=outcome.missing,
        facts=tuple(facts),
        legal_basis=intent_basis(intent_id),
    )
