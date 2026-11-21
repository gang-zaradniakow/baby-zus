"""Eksport JSON Schema kontraktów do ``docs/contracts``.

    python -m contracts.schema            # zapisz/odśwież pliki
    python -m contracts.schema --check    # tylko sprawdź, czy pliki są aktualne (CI)

Karty i etapy eksportujemy w trybie ``serialization`` (tak je widzi frontend w odpowiedzi API),
profil w trybie ``validation`` (tak go wysyła formularz albo backend).
"""

import argparse
import json
import sys
from pathlib import Path
from typing import Any, Final

from pydantic import BaseModel
from pydantic.json_schema import JsonSchemaMode

from contracts.answer import AnswerCard
from contracts.intent import Intent
from contracts.profile import Profile, StageInfo

SCHEMAS: Final[dict[str, tuple[type[BaseModel], JsonSchemaMode]]] = {
    "answer-card": (AnswerCard, "serialization"),
    "intent": (Intent, "serialization"),
    "profile": (Profile, "validation"),
    "stage-info": (StageInfo, "serialization"),
}
DEFAULT_OUT_DIR: Final = Path("docs/contracts")


def build_schemas() -> dict[str, dict[str, Any]]:
    return {
        name: {
            "$schema": "https://json-schema.org/draft/2020-12/schema",
            **model.model_json_schema(mode=mode, by_alias=True),
        }
        for name, (model, mode) in SCHEMAS.items()
    }


def render(schema: dict[str, Any]) -> str:
    return json.dumps(schema, indent=2, ensure_ascii=False) + "\n"


def schema_path(out_dir: Path, name: str) -> Path:
    return out_dir / f"{name}.schema.json"


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Eksport JSON Schema kontraktów.")
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT_DIR, help="katalog docelowy")
    parser.add_argument("--check", action="store_true", help="nie zapisuj, tylko porównaj")
    args = parser.parse_args(argv)

    stale: list[str] = []
    for name, schema in build_schemas().items():
        path = schema_path(args.out, name)
        content = render(schema)
        current = path.read_text(encoding="utf-8") if path.exists() else None
        if current == content:
            continue
        if args.check:
            stale.append(str(path))
        else:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(content, encoding="utf-8", newline="\n")
            print(f"zapisano {path}")

    if stale:
        print("Nieaktualne schematy (uruchom: python tasks.py schemas):", *stale, sep="\n  ")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
