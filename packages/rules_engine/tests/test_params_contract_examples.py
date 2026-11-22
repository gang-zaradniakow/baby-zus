"""Przykłady kontraktu odwołują się do istniejącej wersji parametrów."""

import json
from pathlib import Path

from rules_engine.params import get_by_version

EXAMPLE = Path(__file__).resolve().parents[3] / "docs/contracts/examples/answer-card.example.json"


def test_example_card_engine_version_exists_in_registry() -> None:
    version = json.loads(EXAMPLE.read_text(encoding="utf-8"))["engineVersion"]
    assert get_by_version(version).version_id == version
