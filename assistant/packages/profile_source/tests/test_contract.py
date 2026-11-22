"""Wspólne testy kontraktowe portu – każdy test przechodzi dla adaptera mock i http (ZUS-30)."""

from decimal import Decimal
from pathlib import Path

import pytest

from contracts import Flag, ParentProfile, ParentRole, Stage, StageInfo
from profile_source import (
    ConsentRequiredError,
    MockProfileSource,
    ProfileNotFoundError,
    ProfileSource,
)
from profile_source.personas import Persona, load_personas

PERSONAS_DIR = Path(__file__).resolve().parents[3] / "data" / "personas"
PERSONAS = load_personas(PERSONAS_DIR)
STAGED = [p for p in PERSONAS if p.stage is not None]


def test_adapter_satisfies_port(source: ProfileSource) -> None:
    assert isinstance(source, ProfileSource)


async def test_tp01_persona_t01_profile(source: ProfileSource) -> None:
    profile = await source.get_profile("persona-t01")
    assert profile == PERSONAS[0].profile
    assert profile.applicant.role is ParentRole.MOTHER


async def test_tp01_every_persona_identical_through_adapter(
    source: ProfileSource, mock_source: MockProfileSource
) -> None:
    for ref in mock_source.user_refs:
        profile = await source.get_profile(ref)
        assert profile.model_dump(mode="json") == mock_source.profile(ref).model_dump(mode="json")
        assert await source.get_child_stage(ref) == mock_source.stage(ref)


@pytest.mark.parametrize("user_ref", ["persona-t99", "a/b?c", "../persona-t01"])
async def test_tp02_unknown_user_is_not_found(source: ProfileSource, user_ref: str) -> None:
    with pytest.raises(ProfileNotFoundError):
        await source.get_profile(user_ref)
    with pytest.raises(ProfileNotFoundError):
        await source.get_partner_profile(user_ref)
    with pytest.raises(ProfileNotFoundError):
        await source.get_child_stage(user_ref)


@pytest.mark.parametrize("persona", STAGED, ids=[p.id for p in STAGED])
async def test_tp03_stage_matches_persona(source: ProfileSource, persona: Persona) -> None:
    assert persona.stage is not None
    stage = await source.get_child_stage(persona.profile.profile_id)
    assert stage == StageInfo(stage=persona.stage.stage, flags=persona.stage.flags)


async def test_tp03_stage_examples(source: ProfileSource) -> None:
    expected = {
        "persona-t01": (Stage.E2, []),
        "persona-t02": (Stage.E0, []),
        "persona-t05": (Stage.E1, []),
        "persona-t07": (Stage.E2, [Flag.DIFFICULT]),
        "persona-t10": (Stage.E2, [Flag.ADOPTION]),
    }
    for ref, (stage, flags) in expected.items():
        assert await source.get_child_stage(ref) == StageInfo(stage=stage, flags=flags), ref


@pytest.mark.parametrize("user_ref", ["persona-t08", "persona-t01"])
async def test_tp04_partner_without_consent(source: ProfileSource, user_ref: str) -> None:
    """T08: partner zadeklarowany bez zgody; T01: brak partnera i zgody."""
    with pytest.raises(ConsentRequiredError):
        await source.get_partner_profile(user_ref)


async def test_tp04_partner_with_consent(source: ProfileSource) -> None:
    partner = await source.get_partner_profile("persona-t09")
    assert isinstance(partner, ParentProfile)
    assert partner.role is ParentRole.FATHER
    assert len(partner.insurance.salaries) == 12
    assert {s.gross for s in partner.insurance.salaries} == {Decimal("9000.00")}


async def test_consent_without_partner_data_is_not_found(source: ProfileSource) -> None:
    with pytest.raises(ProfileNotFoundError, match="partner"):
        await source.get_partner_profile("test-consent-no-partner")
