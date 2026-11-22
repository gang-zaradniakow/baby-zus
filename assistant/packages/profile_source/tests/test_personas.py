"""Persony testowe (ZUS-31, TP-09) i walidacja formatu pliku golden (ZUS-20)."""

import json
import re
from pathlib import Path
from typing import Any

import pytest
from pydantic import ValidationError

from contracts import (
    InsuranceTitle,
    ParentProfile,
    Profile,
    SicknessInsurance,
    SpecialEventKind,
)
from profile_source.personas import (
    CaseSource,
    ExpectedAnswer,
    Persona,
    SourceKind,
    load_persona,
    load_personas,
)

PERSONAS_DIR = Path(__file__).resolve().parents[3] / "data" / "personas"


def minimal(**overrides: Any) -> dict[str, Any]:
    data: dict[str, Any] = {
        "id": "T99",
        "title": "Test",
        "scenario": "Scenariusz testowy",
        "scope": "ENGINE",
        "source": {"kind": "MANUAL", "note": "ręcznie"},
        "today": "2026-11-22",
        "profile": {
            "profileId": "p",
            "applicant": {"role": "MOTHER", "insurance": {"source": "USER"}},
            "child": {"source": "USER"},
        },
        "expected": [{"intentId": "A.01_prawo_do_macierzynskiego", "verdict": "NEED_INFO"}],
    }
    return {**data, **overrides}


def test_tp09_all_personas_are_valid_profiles() -> None:
    personas = load_personas(PERSONAS_DIR)
    assert len(personas) == 12
    for persona in personas:
        assert isinstance(persona.profile, Profile)
        assert persona.profile.profile_id == f"persona-{persona.id.lower()}"


def test_persona_files_roundtrip_without_loss() -> None:
    """Model nie gubi ani nie zmienia żadnego pola z pliku (np. kwot jako tekst)."""
    for path in sorted(PERSONAS_DIR.glob("T*.json")):
        raw = json.loads(path.read_text(encoding="utf-8"))
        dumped = load_persona(path).model_dump(mode="json", exclude_unset=True)
        assert dumped == raw, path.name


def test_minimal_persona_is_valid() -> None:
    assert Persona.model_validate(minimal()).id == "T99"


@pytest.mark.parametrize(
    ("overrides", "message"),
    [
        ({"expected": []}, "wymaga sekcji 'expected'"),
        ({"scope": "LEVEL2"}, "wymaga sekcji 'level2'"),
        ({"id": "X1"}, "String should match pattern"),
        (
            {
                "expected": [
                    {"intentId": "A.01_prawo_do_macierzynskiego", "verdict": "YES"},
                    {"intentId": "A.01_prawo_do_macierzynskiego", "verdict": "NO"},
                ]
            },
            "więcej niż raz",
        ),
    ],
)
def test_invalid_persona_is_rejected(overrides: dict[str, Any], message: str) -> None:
    with pytest.raises(ValidationError, match=message):
        Persona.model_validate(minimal(**overrides))


@pytest.mark.parametrize(
    ("data", "message"),
    [
        ({}, "albo 'verdict', albo 'unsupported'"),
        ({"verdict": "YES", "unsupported": True}, "albo 'verdict', albo 'unsupported'"),
        ({"verdict": "YES", "missing": ["child.birthDate"]}, "tylko przy NEED_INFO"),
    ],
)
def test_expected_answer_rules(data: dict[str, Any], message: str) -> None:
    with pytest.raises(ValidationError, match=message):
        ExpectedAnswer.model_validate({"intentId": "A.01_prawo_do_macierzynskiego", **data})


def test_zus_case_source_requires_page() -> None:
    with pytest.raises(ValidationError, match="numeru strony"):
        CaseSource(kind=SourceKind.ZUS_CASE, note="sprawa")
    source = CaseSource(kind=SourceKind.ZUS_CASE, document="sprawy_ZUS.pdf", page=3, note="T1")
    assert source.describe() == "sprawy_ZUS.pdf, str. 3"
    assert CaseSource(kind=SourceKind.MANUAL, note="x").describe() == "wyliczenie ręczne: x"


def test_file_name_must_start_with_id(tmp_path: Path) -> None:
    path = tmp_path / "T98_zla_nazwa.json"
    path.write_text(json.dumps(minimal()), encoding="utf-8")
    with pytest.raises(ValueError, match="musi zaczynać się od 'T99_'"):
        load_persona(path)


def test_duplicate_ids_are_rejected(tmp_path: Path) -> None:
    for name in ("T99_a.json", "T99_b.json"):
        (tmp_path / name).write_text(json.dumps(minimal()), encoding="utf-8")
    with pytest.raises(ValueError, match="powtórzone identyfikatory"):
        load_personas(tmp_path)


def _parents(persona: Persona) -> list[ParentProfile]:
    profile = persona.profile
    return [profile.applicant, *([profile.partner] if profile.partner else [])]


def test_personas_cover_data_needed_by_mocks() -> None:
    """Persony dostarczają mockom MCP i API każdy rodzaj danych (ZUS-31)."""
    personas = load_personas(PERSONAS_DIR)
    parents = [parent for persona in personas for parent in _parents(persona)]
    periods = [period for parent in parents for period in parent.insurance.periods]
    payers = [p.insurance.payer for p in parents if p.insurance.payer is not None]
    profiles = [persona.profile for persona in personas]
    events = {event.kind for profile in profiles for event in profile.special_events}

    assert {p.title for p in periods} == set(InsuranceTitle)
    assert {p.sickness for p in periods} == set(SicknessInsurance)
    assert any(p.end_reason is not None for p in periods), "okres zakończony z przyczyną"
    assert any(leave.code == "B" for parent in parents for leave in parent.insurance.sick_leaves), (
        "e-ZLA z kodem B (ciąża)"
    )
    assert any(p.insured_count_nov30 > 20 for p in payers), "płatnik > 20 ubezpieczonych"
    assert any(p.insured_count_nov30 <= 20 for p in payers), "płatnik ≤ 20 ubezpieczonych"
    assert any(p.insurance.contribution_debt for p in parents), "zadłużenie składkowe"
    assert any(p.partner and p.partner_consent for p in profiles), "partner ze zgodą"
    assert any(p.partner and not p.partner_consent for p in profiles), "partner bez zgody"
    assert any(p.child.placement is not None for p in profiles), "przyjęcie dziecka"
    assert any(p.child.birth_date is None and p.child.expected_birth_date for p in profiles), (
        "ciąża"
    )
    assert any(p.leave_plan for p in profiles), "plan urlopu"
    assert {SpecialEventKind.STILLBIRTH, SpecialEventKind.MOTHER_HOSPITALIZATION} <= events


def test_personas_never_contain_pesel_like_numbers() -> None:
    for path in sorted(PERSONAS_DIR.glob("*")):
        assert not re.search(r"\d{11}", path.read_text(encoding="utf-8")), path.name
