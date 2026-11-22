"""ZUS-33: kalkulator MCP == ``rules_engine.evaluate`` (TM-09…TM-11)."""

from collections.abc import Awaitable, Callable
from datetime import date
from pathlib import Path
from typing import Any

import pytest
from mcp_types import CallToolResult

from contracts import AnswerCard, Profile, Verdict
from mcp_servers.common.runtime import ServerDeps
from mcp_servers.kalkulator import server as kalkulator
from profile_source.personas import Persona, load_personas
from rules_engine.evaluate import Unsupported, evaluate

PERSONAS = load_personas(Path(__file__).resolve().parents[3] / "data" / "personas")
TODAY = date(2026, 11, 22)  # = zegar testowy z conftest (09:00 UTC)
Call = Callable[..., Awaitable[CallToolResult]]


def ok(result: CallToolResult) -> dict[str, Any]:
    assert not result.is_error, result.structured_content
    assert result.structured_content is not None
    return result.structured_content


def expected(intent_id: str, profile: Profile, today: date) -> dict[str, Any]:
    result = evaluate(intent_id, profile, today)
    if isinstance(result, AnswerCard):
        return {"kind": "CARD", "card": result.model_dump(mode="json"), "unsupported": None}
    assert isinstance(result, Unsupported)
    return {
        "kind": "UNSUPPORTED",
        "card": None,
        "unsupported": {
            "intentId": result.intent_id,
            "reason": result.reason,
            "legalBasis": [ref.model_dump(mode="json") for ref in result.legal_basis],
        },
    }


def test_personas_share_the_test_clock_date() -> None:
    assert {p.today for p in PERSONAS} == {TODAY}


@pytest.mark.parametrize(
    ("tool", "persona"),
    [
        ("calc_maternity", "persona-t01"),
        ("calc_sickness", "persona-t02"),
        ("calc_parental_split", "persona-t09"),
        ("calc_part_time", "persona-t09"),
        ("calc_adoption", "persona-t10"),
    ],
)
async def test_tm09_each_calc_tool_returns_answer_card(
    deps: ServerDeps, call: Call, tool: str, persona: str
) -> None:
    data = ok(await call(kalkulator.build(deps), tool, {"user_ref": persona}, user=persona))
    assert data["kind"] == "CARD"
    card = AnswerCard.model_validate(data["card"])
    assert card.intent_id == kalkulator.CALC_INTENTS[tool]


@pytest.mark.parametrize("persona", PERSONAS, ids=[p.id for p in PERSONAS])
async def test_tm10_mcp_equals_library_for_personas(
    deps: ServerDeps, call: Call, persona: Persona
) -> None:
    server = kalkulator.build(deps)
    user = persona.profile.profile_id
    intents = {e.intent_id for e in persona.expected} | set(kalkulator.CALC_INTENTS.values())
    for intent_id in sorted(intents):
        data = ok(
            await call(
                server, "check_eligibility", {"user_ref": user, "intent_id": intent_id}, user=user
            )
        )
        assert data == expected(intent_id, persona.profile, persona.today), intent_id


async def test_tm10_calc_tool_equals_check_eligibility(deps: ServerDeps, call: Call) -> None:
    server = kalkulator.build(deps)
    by_calc = ok(await call(server, "calc_maternity", {"user_ref": "persona-t01"}))
    by_check = ok(
        await call(
            server,
            "check_eligibility",
            {"user_ref": "persona-t01", "intent_id": "B.01_wysokosc_macierzynskiego"},
        )
    )
    assert by_calc == by_check


async def test_unsupported_is_structured(deps: ServerDeps, call: Call) -> None:
    data = ok(
        await call(
            kalkulator.build(deps),
            "check_eligibility",
            {"user_ref": "persona-t01", "intent_id": "H.07_ochrona_przed_zwolnieniem"},
        )
    )
    assert data["kind"] == "UNSUPPORTED"
    assert data["card"] is None
    assert data["unsupported"]["legalBasis"]


ANON_PROFILE: dict[str, Any] = {
    "profileId": "anon-1234",
    "applicant": {
        "role": "MOTHER",
        "insurance": {
            "source": "USER",
            "periods": [{"title": "EMPLOYMENT", "sickness": "MANDATORY", "dateFrom": "2023-01-02"}],
        },
    },
    "child": {"source": "USER"},
}


async def test_tm11_incomplete_profile_gives_need_info(deps: ServerDeps, call: Call) -> None:
    data = ok(
        await call(
            kalkulator.build(deps),
            "calc_maternity",
            {"user_ref": "anon-1234", "profile": ANON_PROFILE},
            user="anon-1234",
        )
    )
    card = AnswerCard.model_validate(data["card"])
    assert card.verdict is Verdict.NEED_INFO
    assert [m.field for m in card.missing] == ["child.expectedBirthDate"]
    assert card.calculation is None


async def test_profile_argument_equals_library(deps: ServerDeps, call: Call) -> None:
    profile = {**ANON_PROFILE, "child": {"source": "USER", "birthDate": "2026-11-12"}}
    data = ok(
        await call(
            kalkulator.build(deps),
            "check_eligibility",
            {
                "user_ref": "anon-1234",
                "intent_id": "C.01_wymiar_macierzynskiego",
                "profile": profile,
            },
            user="anon-1234",
        )
    )
    assert data == expected("C.01_wymiar_macierzynskiego", Profile.model_validate(profile), TODAY)


async def test_profile_of_other_user_is_forbidden(deps: ServerDeps, call: Call) -> None:
    result = await call(
        kalkulator.build(deps),
        "calc_maternity",
        {"user_ref": "persona-t01", "profile": ANON_PROFILE},
    )
    assert result.is_error
    assert result.structured_content is not None
    assert result.structured_content["code"] == "FORBIDDEN"


@pytest.mark.parametrize(
    ("arguments", "code"),
    [
        ({"user_ref": "persona-t01", "intent_id": "X.99_nie_ma"}, "NOT_FOUND"),
        ({"user_ref": "persona-t01"}, "INVALID_ARGUMENTS"),
        (
            {"user_ref": "persona-t01", "intent_id": "A.01", "profile": {"x": 1}},
            "INVALID_ARGUMENTS",
        ),
    ],
)
async def test_bad_calls(
    deps: ServerDeps, call: Call, arguments: dict[str, Any], code: str
) -> None:
    result = await call(kalkulator.build(deps), "check_eligibility", arguments)
    assert result.is_error
    assert result.structured_content is not None
    assert result.structured_content["code"] == code
