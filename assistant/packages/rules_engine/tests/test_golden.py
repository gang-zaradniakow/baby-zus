"""Sprawy golden T1–T12 (ZUS-20 w wersji okrojonej): GOLD-00 i GOLD-*.

Wejście i oczekiwania są w ``data/personas/*.json`` (wspólne z mockiem ``ProfileSource``).
Komunikat błędu wskazuje personę i źródło oczekiwań (wyliczenie ręczne albo strona sprawy
ZUS), więc przy różnicy od razu wiadomo, gdzie szukać.
"""

from pathlib import Path

import pytest

from contracts import AnswerCard, Verdict
from profile_source.personas import ExpectedAnswer, Persona, Scope, load_personas
from rules_engine.catalog import INTENTS_BY_ID, detect_stage
from rules_engine.evaluate import Unsupported, evaluate

PERSONAS_DIR = Path(__file__).resolve().parents[3] / "data" / "personas"
PERSONAS = load_personas(PERSONAS_DIR)
SCENARIOS = [f"T{n:02d}" for n in range(1, 13)]
CASES = [(p, e) for p in PERSONAS for e in p.expected]

pytestmark = pytest.mark.golden


def test_gold00_personas_cover_all_scenarios() -> None:
    assert [p.id for p in PERSONAS] == SCENARIOS
    for persona in PERSONAS:
        for expected in persona.expected:
            assert expected.intent_id in INTENTS_BY_ID, f"{persona.id}: {expected.intent_id}"


def test_gold00_engine_scenarios_have_expectations() -> None:
    engine = [p for p in PERSONAS if p.scope is Scope.ENGINE]
    assert {p.id for p in engine} == set(SCENARIOS[:10])
    assert all(p.expected for p in engine)


@pytest.mark.parametrize(
    ("persona", "expected"), CASES, ids=[f"{p.id}-{e.intent_id[:4]}" for p, e in CASES]
)
def test_golden_case(persona: Persona, expected: ExpectedAnswer) -> None:
    where = f"{persona.id} {expected.intent_id} ← {persona.source.describe()}"
    result = evaluate(expected.intent_id, persona.profile, persona.today)

    if expected.unsupported:
        assert isinstance(result, Unsupported), where
        assert result.legal_basis, where
        return
    assert isinstance(result, AnswerCard), f"{where}: {result}"
    assert result.verdict is expected.verdict, f"{where}: {result.summary}"

    if expected.missing is not None:
        assert [m.field for m in result.missing] == expected.missing, where
    for phrase in expected.summary_contains:
        assert phrase in result.summary.replace(" ", " "), f"{where}: {result.summary}"
    warnings = " | ".join(result.warnings).replace(" ", " ")
    for phrase in expected.warnings_contain:
        assert phrase in warnings, f"{where}: {warnings}"
    if expected.calculation is not None:
        _check_calculation(result, expected, where)


def _check_calculation(card: AnswerCard, expected: ExpectedAnswer, where: str) -> None:
    want = expected.calculation
    got = card.calculation
    assert want is not None
    assert got is not None, f"{where}: karta bez wyliczenia"
    for name in ("base", "rate", "monthly", "total"):
        value = getattr(want, name)
        if value is not None:
            assert getattr(got, name) == value, f"{where}: {name}"
    if want.periods is not None:
        assert len(got.periods) == len(want.periods), f"{where}: liczba okresów"
        for index, (w, g) in enumerate(zip(want.periods, got.periods, strict=True)):
            label = f"{where}: okres {index + 1}"
            assert (g.type, g.date_from, g.date_to) == (w.type, w.date_from, w.date_to), label
            if w.rate is not None:
                assert g.rate == w.rate, f"{label}: stawka"
            if w.amount is not None:
                assert g.amount == w.amount, f"{label}: kwota"


@pytest.mark.parametrize(
    "persona", [p for p in PERSONAS if p.stage is not None], ids=lambda p: p.id
)
def test_golden_stage(persona: Persona) -> None:
    assert persona.stage is not None
    result = detect_stage(persona.profile, persona.today)
    assert result.stage is persona.stage.stage, persona.id
    assert list(result.flags) == persona.stage.flags, persona.id


def test_golden_verdicts_are_not_all_yes() -> None:
    """Zestaw sprawdza też NO i NEED_INFO – inaczej nie wykryłby zbyt łaskawej reguły."""
    verdicts = {e.verdict for _, e in CASES if e.verdict is not None}
    assert verdicts == set(Verdict)
