"""ZUS-42: poziom 1 – etap, lista pytań, karta z silnika, uzupełnianie braków (TA-10…TA-18)."""

import json
import time
from collections.abc import Callable
from pathlib import Path
from typing import Any

import pytest
from fastapi.testclient import TestClient
from jsonschema import Draft202012Validator

from contracts import AnswerCard, FactSource, Profile, Verdict
from profile_source.personas import load_persona
from rules_engine.catalog import INTENTS_BY_ID, featured_intents
from rules_engine.evaluate import evaluate

ROOT = Path(__file__).resolve().parents[3]
PERSONAS_DIR = ROOT / "data" / "personas"
CARD_SCHEMA = Draft202012Validator(
    json.loads((ROOT / "docs" / "contracts" / "answer-card.schema.json").read_text("utf-8"))
)
Login = Callable[..., dict[str, str]]

EMPLOYEE_FORM: dict[str, Any] = {
    "applicant": {
        "role": "MOTHER",
        "insurance": {
            "periods": [{"title": "EMPLOYMENT", "sickness": "MANDATORY", "dateFrom": "2023-01-02"}]
        },
    },
    "child": {},
}


def form_session(client: TestClient, form: dict[str, Any] = EMPLOYEE_FORM) -> dict[str, str]:
    response = client.post("/auth/anonymous", json=form)
    assert response.status_code == 201, response.text
    return {"Authorization": f"Bearer {response.json()['token']}"}


def ask(client: TestClient, headers: dict[str, str], intent_id: str, **body: Any) -> Any:
    return client.post("/answers", json={"intentId": intent_id, **body}, headers=headers)


# --- etap i lista pytań ------------------------------------------------------------------


def test_ta10_t07_stage_is_e2_with_difficult(client: TestClient, login: Login) -> None:
    response = client.get("/me/stage", headers=login("persona-t07"))
    assert response.status_code == 200
    assert response.json() == {"stage": "E2", "flags": ["DIFFICULT"]}


def test_stage_from_form_profile_uses_clock_date(client: TestClient) -> None:
    form = {**EMPLOYEE_FORM, "child": {"expectedBirthDate": "2026-12-20"}}
    response = client.get("/me/stage", headers=form_session(client, form))
    assert response.json() == {"stage": "E1", "flags": []}  # 28 dni przed porodem


def test_ta11_e1_lists_5_to_8_intents_in_engine_order(client: TestClient) -> None:
    response = client.get("/intents", params={"stage": "E1"})
    assert response.status_code == 200
    ids = [intent["id"] for intent in response.json()]
    assert 5 <= len(ids) <= 8
    assert ids == [intent.id for intent in featured_intents_for("E1")]


def featured_intents_for(stage: str) -> list[Any]:
    from contracts import Stage, StageInfo

    return featured_intents(StageInfo(stage=Stage(stage)))


def test_intents_with_flags_and_without_stage(client: TestClient) -> None:
    difficult = client.get("/intents", params={"stage": "E2", "flags": ["DIFFICULT", "DIFFICULT"]})
    assert difficult.status_code == 200
    general = client.get("/intents")
    assert general.json()[0]["id"] == "A.01_prawo_do_macierzynskiego"
    assert difficult.json() != general.json()


def test_intents_search(client: TestClient) -> None:
    response = client.get("/intents", params={"q": "macierzyński"})
    assert response.status_code == 200
    assert response.json()
    assert all(item["id"] in INTENTS_BY_ID for item in response.json())


@pytest.mark.parametrize("params", [{"stage": "E9"}, {"flags": "WEEKEND"}, {"q": "a"}])
def test_ta12_bad_query_is_422(client: TestClient, params: dict[str, str]) -> None:
    response = client.get("/intents", params=params)
    assert response.status_code == 422
    assert response.json()["code"] == "VALIDATION_ERROR"


# --- karta z silnika ---------------------------------------------------------------------


def test_ta13_b01_for_t01_matches_golden(client: TestClient, login: Login) -> None:
    persona = load_persona(next(PERSONAS_DIR.glob("T01_*.json")))
    expected = next(e for e in persona.expected if e.intent_id == "B.01_wysokosc_macierzynskiego")
    response = ask(client, login("persona-t01"), "B.01_wysokosc_macierzynskiego")
    assert response.status_code == 200
    body = response.json()
    assert body["kind"] == "CARD"
    card = AnswerCard.model_validate(body["card"])
    assert card.verdict is expected.verdict
    assert expected.calculation is not None
    assert card.calculation is not None
    assert card.calculation.base == expected.calculation.base
    assert card.calculation.monthly == expected.calculation.monthly
    assert card.calculation.total == expected.calculation.total
    # API nie zmienia niczego w karcie silnika
    assert card == evaluate("B.01_wysokosc_macierzynskiego", persona.profile, persona.today)


@pytest.mark.parametrize("intent_id", ["X.99", "X.99_nie_ma", "A.99_brak"])
def test_ta14_unknown_intent_is_404(client: TestClient, login: Login, intent_id: str) -> None:
    response = ask(client, login(), intent_id)
    assert response.status_code == 404
    assert response.json()["code"] == "INTENT_NOT_FOUND"


def test_answers_require_session(client: TestClient) -> None:
    response = client.post("/answers", json={"intentId": "B.01_wysokosc_macierzynskiego"})
    assert response.status_code == 401


def test_unsupported_points_to_level2_and_escalation(client: TestClient, login: Login) -> None:
    response = ask(client, login(), "H.07_ochrona_przed_zwolnieniem")
    assert response.status_code == 200
    body = response.json()
    assert body["kind"] == "UNSUPPORTED"
    assert body["card"] is None
    unsupported = body["unsupported"]
    assert unsupported["intentId"] == "H.07_ochrona_przed_zwolnieniem"
    assert unsupported["legalBasis"], "podstawa prawna z rejestru silnika"
    assert [a["type"] for a in unsupported["actions"]] == ["ESCALATE"]
    assert "czacie" in unsupported["message"]


# --- uzupełnianie braków -----------------------------------------------------------------


def test_ta15_need_info_then_patch_then_yes(client: TestClient) -> None:
    headers = form_session(client)
    first = ask(client, headers, "A.01_prawo_do_macierzynskiego").json()["card"]
    assert first["verdict"] == "NEED_INFO"
    missing = [m["field"] for m in first["missing"]]
    assert missing == ["child.expectedBirthDate"]

    patched = client.patch(
        "/me/profile", json={"child": {"birthDate": "2026-11-12"}}, headers=headers
    )
    assert patched.status_code == 200
    assert Profile.model_validate(patched.json()).child.source is FactSource.USER

    second = ask(client, headers, "A.01_prawo_do_macierzynskiego").json()["card"]
    assert second["verdict"] == "YES"


def test_ta15_supplements_inline_in_answer(client: TestClient) -> None:
    headers = form_session(client)
    response = ask(
        client,
        headers,
        "C.01_wymiar_macierzynskiego",
        supplements={"child": {"birthDate": "2026-11-12"}},
    )
    card = response.json()["card"]
    assert card["verdict"] == "YES"
    assert "20 tygodni" in card["summary"]
    # uzupełnienie zostało zapisane w sesji
    profile = client.get("/me/profile", headers=headers).json()
    assert profile["child"]["birthDate"] == "2026-11-12"


def test_patch_of_zus_profile_marks_changed_parts_as_user(client: TestClient, login: Login) -> None:
    headers = login("persona-t01")
    response = client.patch(
        "/me/profile",
        json={
            "applicant": {"insurance": {"contributionDebt": "0.00"}},
            "partner": {"role": "FATHER", "insurance": {"periods": []}},
        },
        headers=headers,
    )
    assert response.status_code == 200
    profile = Profile.model_validate(response.json())
    assert profile.applicant.insurance.source is FactSource.USER
    assert profile.partner is not None
    assert profile.partner.insurance.source is FactSource.USER
    assert profile.child.source is FactSource.ZUS  # nie zmieniane
    # po uzupełnieniu etap liczy API z profilu sesji – ten sam wynik co z backendu
    assert client.get("/me/stage", headers=headers).json() == {"stage": "E2", "flags": []}


def test_patch_null_removes_partner(client: TestClient, login: Login) -> None:
    response = client.patch("/me/profile", json={"partner": None}, headers=login("persona-t08"))
    assert response.status_code == 200
    assert response.json()["partner"] is None


@pytest.mark.parametrize(
    ("patch", "loc"),
    [
        ({"child": {"source": "ZUS"}}, ["body", "child", "source"]),
        ({"specialEvents": [{"kind": "STILLBIRTH", "dateFrom": "x", "source": "ZUS"}]}, None),
        ({"child": {"childrenCount": 0}}, ["profile", "child", "childrenCount"]),
        ({"child": None}, ["profile", "child"]),
        ({"applicant": None}, ["profile", "applicant"]),
        ({"partner": {"role": "FATHER"}}, ["profile", "partner", "insurance"]),
    ],
)
def test_invalid_patch_is_422(
    client: TestClient, login: Login, patch: dict[str, Any], loc: list[str] | None
) -> None:
    response = client.patch("/me/profile", json=patch, headers=login())
    assert response.status_code == 422
    body = response.json()
    assert body["code"] == "VALIDATION_ERROR"
    if loc is not None:
        assert loc in [d["loc"] for d in body["details"]]


# --- jakość odpowiedzi -------------------------------------------------------------------


def test_ta16_level1_p95_under_1s(client: TestClient, login: Login) -> None:
    headers = login("persona-t01")
    durations = []
    for _ in range(20):
        start = time.perf_counter()
        response = ask(client, headers, "B.01_wysokosc_macierzynskiego")
        durations.append(time.perf_counter() - start)
        assert response.status_code == 200
    p95 = sorted(durations)[int(0.95 * len(durations)) - 1]
    assert p95 < 1.0, f"p95 = {p95:.3f} s"


@pytest.mark.parametrize("persona", [f"persona-t{n:02d}" for n in range(1, 13)])
def test_ta17_cards_match_answer_card_schema(
    client: TestClient, login: Login, persona: str
) -> None:
    headers = login(persona)
    for intent_id in ("A.01_prawo_do_macierzynskiego", "B.01_wysokosc_macierzynskiego"):
        body = ask(client, headers, intent_id).json()
        assert body["kind"] == "CARD"
        errors = [e.message for e in CARD_SCHEMA.iter_errors(body["card"])]
        assert errors == [], (persona, intent_id, errors)
        assert body["card"]["verdict"] in {v.value for v in Verdict}


@pytest.mark.parametrize(
    "body",
    [
        {"intentId": "B.01_wysokosc_macierzynskiego", "verdict": "YES"},
        {"intentId": "B.01_wysokosc_macierzynskiego", "supplements": {"profileId": "x"}},
        {"intent": "B.01_wysokosc_macierzynskiego"},
        {"intentId": ""},
    ],
)
def test_ta18_extra_or_bad_fields_are_422(
    client: TestClient, login: Login, body: dict[str, Any]
) -> None:
    response = client.post("/answers", json=body, headers=login())
    assert response.status_code == 422
    assert response.json()["code"] == "VALIDATION_ERROR"
