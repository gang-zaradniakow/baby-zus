import json
from collections.abc import Callable
from pathlib import Path
from typing import Any

import pytest

REPO_ROOT = Path(__file__).resolve().parents[3]
CONTRACTS_DIR = REPO_ROOT / "docs" / "contracts"
EXAMPLES_DIR = CONTRACTS_DIR / "examples"

type JsonDict = dict[str, Any]


def load_json(path: Path) -> JsonDict:
    data: JsonDict = json.loads(path.read_text(encoding="utf-8"))
    return data


@pytest.fixture
def card_json() -> JsonDict:
    """Przykład karty z §5.1/§5.2 (docs/contracts/examples) – świeża kopia na każdy test."""
    return load_json(EXAMPLES_DIR / "answer-card.example.json")


@pytest.fixture
def profile_json() -> JsonDict:
    return load_json(EXAMPLES_DIR / "profile.example.json")


@pytest.fixture
def need_info_card(card_json: JsonDict) -> JsonDict:
    """Poprawna karta NEED_INFO: bez wyliczenia, z listą braków."""
    card_json.update(
        verdict="NEED_INFO",
        calculation=None,
        missing=[{"field": "child.childrenCount", "question": "Ile dzieci urodziło się?"}],
    )
    return card_json


@pytest.fixture
def make_intent() -> Callable[..., JsonDict]:
    def factory(**overrides: Any) -> JsonDict:
        intent: JsonDict = {
            "id": "C.01_wymiar_macierzynskiego",
            "category": "C",
            "question": "Ile tygodni urlopu macierzyńskiego mi przysługuje?",
            "answerTypes": ["K"],
            "stages": ["E0", "E1", "E2"],
            "requiredFields": ["child.childrenCount"],
            "priority": 10,
        }
        intent.update(overrides)
        return intent

    return factory
