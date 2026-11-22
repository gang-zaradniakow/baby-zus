"""TC-05: JSON Schema w docs/contracts jest aktualna i zgodna z ustaleniami."""

import json
from pathlib import Path
from typing import Any

import pytest

from contracts import schema

CONTRACTS_DIR = Path(__file__).resolve().parents[3] / "docs" / "contracts"


def load_json(path: Path) -> dict[str, Any]:
    data: dict[str, Any] = json.loads(path.read_text(encoding="utf-8"))
    return data


@pytest.mark.parametrize("name", sorted(schema.SCHEMAS))
def test_json_schema_matches_committed_file(name: str) -> None:
    path = schema.schema_path(CONTRACTS_DIR, name)
    assert path.exists(), f"brak {path} – uruchom: python tasks.py schemas"
    assert path.read_text(encoding="utf-8") == schema.render(schema.build_schemas()[name]), (
        f"{path.name} jest nieaktualny – uruchom: python tasks.py schemas"
    )


def test_answer_card_schema_has_no_reminder_action() -> None:
    card = load_json(schema.schema_path(CONTRACTS_DIR, "answer-card"))
    assert card["$defs"]["ActionType"]["enum"] == ["FORM", "SIMULATE", "ESCALATE"]


def test_answer_card_schema_describes_money_as_decimal_string() -> None:
    card = load_json(schema.schema_path(CONTRACTS_DIR, "answer-card"))
    base = card["$defs"]["Calculation"]["properties"]["base"]
    assert base["type"] == "string"
    assert base["pattern"] == r"^\d+\.\d{2}$"


def test_cli_writes_then_check_passes(tmp_path: Path) -> None:
    assert schema.main(["--out", str(tmp_path), "--check"]) == 1  # brak plików
    assert schema.main(["--out", str(tmp_path)]) == 0
    assert schema.main(["--out", str(tmp_path), "--check"]) == 0
    assert schema.main(["--out", str(tmp_path)]) == 0  # nic do zmiany


def test_cli_check_detects_drift(tmp_path: Path, capsys: pytest.CaptureFixture[str]) -> None:
    schema.main(["--out", str(tmp_path)])
    schema.schema_path(tmp_path, "intent").write_text("{}\n", encoding="utf-8")

    assert schema.main(["--out", str(tmp_path), "--check"]) == 1
    assert "intent.schema.json" in capsys.readouterr().out
