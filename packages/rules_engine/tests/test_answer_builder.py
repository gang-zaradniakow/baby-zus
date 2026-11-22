"""Rejestr podstaw prawnych i AnswerBuilder (ZUS-19): TE-59, TE-60, TE-61."""

from decimal import Decimal
from urllib.parse import urlsplit

import pytest

from contracts import ActionType, Calculation, Fact, FactSource, GeneratedBy, Verdict
from contracts.answer import SUMMARY_MAX_LENGTH
from rules_engine.answer_builder import (
    ESCALATE,
    FILL_MISSING,
    EngineAnswer,
    build_card,
    clip,
    default_actions,
    need_info_decision,
)
from rules_engine.catalog import FIELD_QUESTIONS, INTENTS
from rules_engine.eligibility.decision import Decision
from rules_engine.legal import (
    INTENT_LEGAL_BASIS,
    intent_basis,
    legal_refs,
    registered_urls,
    to_legal_ref,
    unverified_refs,
)
from rules_engine.outcomes import NeedInfo
from rules_engine.params import current_params
from rules_engine.params.base import kp, uz

P = current_params()
B01 = "B.01_wysokosc_macierzynskiego"


def decision(verdict: Verdict = Verdict.YES, **kwargs: object) -> Decision:
    defaults: dict[str, object] = {"summary": "Tak.", "legal_basis": (uz("art. 31"),)}
    if verdict is Verdict.NEED_INFO:
        defaults["missing"] = ("child.birthDate",)
    return Decision(verdict=verdict, **{**defaults, **kwargs})  # type: ignore[arg-type]


# --- TE-61: rejestr ------------------------------------------------------------------


def test_te61_legal_urls_on_allowed_domains() -> None:
    for url in registered_urls():
        parts = urlsplit(url)
        assert parts.scheme == "https"
        assert parts.hostname is not None
        assert parts.hostname.endswith(("zus.pl", "gov.pl")), url


def test_every_intent_has_default_legal_basis() -> None:
    assert set(INTENT_LEGAL_BASIS) == {intent.id for intent in INTENTS}
    assert all(INTENT_LEGAL_BASIS.values())


def test_legal_refs_deduplicate_and_keep_order() -> None:
    refs = legal_refs([uz("art. 31"), kp("art. 180"), uz("art. 31", to_verify=True)])
    assert [(r.act, r.article) for r in refs] == [
        ("ustawa zasiłkowa", "art. 31"),
        ("Kodeks pracy", "art. 180"),
    ]


def test_to_legal_ref_uses_isap_link() -> None:
    ref = to_legal_ref(kp("art. 183"))
    assert ref.url.startswith("https://isap.sejm.gov.pl/")
    assert ref.act == "Kodeks pracy"


def test_unverified_refs_lists_only_marked_articles() -> None:
    pairs = list(unverified_refs())
    assert pairs
    assert all(basis.to_verify for _, basis in pairs)
    assert ("F.01_wczesniak", intent_basis("F.01_wczesniak")[0]) in pairs


# --- TE-59 / TE-60: karta ------------------------------------------------------------


def test_te60_card_has_engine_version_and_rules_author() -> None:
    card = build_card(B01, decision(), P)
    assert card.engine_version == P.version_id == "params-2025-03-19"
    assert card.generated_by is GeneratedBy.RULES


def test_te59_fact_sources_are_kept() -> None:
    facts = (
        Fact(label="Podstawa wymiaru", value="6 000,00 zł", source=FactSource.ZUS),
        Fact(label="Liczba dzieci", value="1", source=FactSource.USER),
    )
    card = build_card(B01, decision(facts=facts), P)
    assert [f.source for f in card.facts] == [FactSource.ZUS, FactSource.USER]


def test_actions_end_with_escalation_and_skip_self_reference() -> None:
    card = build_card(B01, decision(), P)
    assert card.actions[-1] == ESCALATE
    assert 1 <= len(card.actions) <= 3
    assert all(a.ref != B01 for a in card.actions)
    b04 = build_card("B.04_warianty_urlopu", decision(), P)
    assert all(a.ref != "B.04_warianty_urlopu" for a in b04.actions)


def test_custom_actions_are_capped_at_three() -> None:
    many = (FILL_MISSING, FILL_MISSING, FILL_MISSING)
    card = build_card(B01, EngineAnswer(decision(), actions=many), P)
    assert len(card.actions) == 3
    assert card.actions[-1].type is ActionType.ESCALATE


def test_need_info_card_has_questions_and_no_calculation() -> None:
    calculation = Calculation(base=Decimal("6000.00"), rate=Decimal("1.00"))
    card = build_card(B01, EngineAnswer(decision(Verdict.NEED_INFO), calculation), P)
    assert card.verdict is Verdict.NEED_INFO
    assert card.calculation is None
    assert card.missing[0].question == FIELD_QUESTIONS["child.birthDate"]
    assert card.actions == [FILL_MISSING, ESCALATE]
    assert default_actions(B01, Verdict.NEED_INFO) == (FILL_MISSING,)


def test_unknown_missing_field_is_an_engine_error() -> None:
    with pytest.raises(KeyError):
        build_card(B01, decision(Verdict.NEED_INFO, missing=("child.shoeSize",)), P)


def test_assumptions_go_to_calculation_or_warnings() -> None:
    plain = build_card(B01, decision(assumptions=("Prognoza.",), warnings=("Ryzyko.",)), P)
    assert plain.warnings == ["Ryzyko.", "Prognoza."]
    calculation = Calculation(
        base=Decimal("6000.00"), rate=Decimal("1.00"), assumptions=["Prognoza."]
    )
    with_calc = build_card(B01, EngineAnswer(decision(assumptions=("Prognoza.",)), calculation), P)
    assert with_calc.warnings == []
    assert with_calc.calculation == calculation


def test_alternatives_are_kept_for_no() -> None:
    card = build_card(B01, decision(Verdict.NO, summary="Nie.", alternatives=("Urlop.",)), P)
    assert card.alternatives == ["Urlop."]


def test_extra_basis_is_appended_without_duplicates() -> None:
    card = build_card(B01, decision(), P, extra_basis=(uz("art. 31"), kp("art. 180")))
    assert [r.article for r in card.legal_basis] == ["art. 31", "art. 180"]


def test_long_summary_is_clipped() -> None:
    card = build_card(B01, decision(summary="x" * 800), P)
    assert len(card.summary) == SUMMARY_MAX_LENGTH
    assert card.summary.endswith("…")
    assert clip("krótko") == "krótko"


def test_need_info_decision_uses_intent_basis() -> None:
    result = need_info_decision(NeedInfo(("child.birthDate",), "Brak daty."), B01)
    assert result.verdict is Verdict.NEED_INFO
    assert result.legal_basis == intent_basis(B01)
