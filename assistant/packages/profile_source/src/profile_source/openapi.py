"""Proponowany kontrakt OpenAPI backendu profilu (U8) – generowany z modeli ``contracts``.

python -m profile_source.openapi            # zapisz/odśwież plik
python -m profile_source.openapi --check    # tylko sprawdź aktualność (CI)
"""

import argparse
import json
import sys
from importlib.metadata import version
from pathlib import Path
from typing import Any, Final

from pydantic import Field
from pydantic.json_schema import models_json_schema

from contracts import ParentProfile, Profile, StageInfo
from contracts._base import ContractModel
from profile_source.http_source import API_PREFIX, CONSENT_CODE

DEFAULT_OUT: Final = Path("docs/contracts/backend-profile.openapi.json")


class ErrorBody(ContractModel):
    """Treść odpowiedzi błędu backendu."""

    code: str = Field(examples=["NOT_FOUND", CONSENT_CODE])
    message: str


def _ref(name: str) -> dict[str, str]:
    return {"$ref": f"#/components/schemas/{name}"}


def _json(schema: dict[str, Any], description: str) -> dict[str, Any]:
    return {"description": description, "content": {"application/json": {"schema": schema}}}


def _operation(op_id: str, summary: str, model: str, *, consent: bool = False) -> dict[str, Any]:
    error = _ref("ErrorBody")
    responses: dict[str, Any] = {
        "200": _json(_ref(model), "OK"),
        "404": _json(error, "Nieznany użytkownik (code: NOT_FOUND)"),
        "429": _json(error, "Za dużo żądań – klient ponawia po Retry-After"),
        "503": _json(error, "Backend chwilowo niedostępny – klient ponawia"),
    }
    if consent:
        responses["403"] = _json(error, f"Brak zgody drugiego rodzica (code: {CONSENT_CODE})")
    return {
        "operationId": op_id,
        "summary": summary,
        "parameters": [{"$ref": "#/components/parameters/UserRef"}],
        "responses": dict(sorted(responses.items())),
    }


def build_openapi() -> dict[str, Any]:
    _, defs = models_json_schema(
        [
            (Profile, "validation"),
            (ParentProfile, "validation"),
            (StageInfo, "validation"),
            (ErrorBody, "validation"),
        ],
        by_alias=True,
        ref_template="#/components/schemas/{model}",
    )
    base = f"{API_PREFIX}/{{userRef}}"
    return {
        "openapi": "3.1.0",
        "info": {
            "title": "Backend profilu – proponowany kontrakt (ZUS-30)",
            "version": version("zus-profile-source"),
            "description": (
                "Kontrakt, którego oczekuje adapter HttpProfileSource. userRef to pseudonim "
                "użytkownika – nigdy PESEL. Dane drugiego rodzica tylko za jego zgodą."
            ),
        },
        "security": [{"bearer": []}],
        "paths": {
            base: {"get": _operation("getProfile", "Profil sprawy", "Profile")},
            f"{base}/partner": {
                "get": _operation(
                    "getPartnerProfile", "Dane drugiego rodzica", "ParentProfile", consent=True
                )
            },
            f"{base}/stage": {"get": _operation("getChildStage", "Etap i flagi", "StageInfo")},
        },
        "components": {
            "schemas": defs["$defs"],
            "parameters": {
                "UserRef": {
                    "name": "userRef",
                    "in": "path",
                    "required": True,
                    "description": "Pseudonimowy identyfikator użytkownika (URL-encoded).",
                    "schema": {"type": "string", "minLength": 1},
                }
            },
            "securitySchemes": {"bearer": {"type": "http", "scheme": "bearer"}},
        },
    }


def render(document: dict[str, Any]) -> str:
    return json.dumps(document, indent=2, ensure_ascii=False) + "\n"


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Eksport kontraktu OpenAPI backendu profilu.")
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT, help="plik docelowy")
    parser.add_argument("--check", action="store_true", help="nie zapisuj, tylko porównaj")
    args = parser.parse_args(argv)

    content = render(build_openapi())
    current = args.out.read_text(encoding="utf-8") if args.out.exists() else None
    if current == content:
        return 0
    if args.check:
        print(f"Nieaktualny kontrakt (uruchom: python tasks.py schemas): {args.out}")
        return 1
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(content, encoding="utf-8", newline="\n")
    print(f"zapisano {args.out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
