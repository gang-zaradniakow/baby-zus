"""Snapshot narzędzi serwerów MCP w ``docs/contracts/mcp/<serwer>.json`` (TM-01).

    python -m mcp_servers.snapshot            # zapisz/odśwież pliki
    python -m mcp_servers.snapshot --check    # tylko sprawdź aktualność (CI)

Zmiana nazwy, opisu albo schematu narzędzia zmienia kontrakt z orkiestratorem (ZUS-52),
więc musi być widoczna w przeglądzie kodu jako zmiana pliku w ``docs/contracts/mcp``.
"""

import argparse
import asyncio
import json
import sys
from pathlib import Path
from typing import Any, Final

from assistant.llm import FakeEmbeddingClient
from assistant.rag import InMemoryKnowledgeIndex, KnowledgeBase
from mcp_servers.common.audit import InMemoryAuditSink
from mcp_servers.common.auth import TokenSigner
from mcp_servers.common.runtime import ServerDeps
from mcp_servers.main import build_servers
from profile_source import MockProfileSource

DEFAULT_OUT_DIR: Final = Path("docs/contracts/mcp")


def _snapshot_deps() -> ServerDeps:
    # Opis narzędzi nie zależy od danych – wystarczą puste zależności.
    knowledge = KnowledgeBase(FakeEmbeddingClient(), InMemoryKnowledgeIndex(), "fake")
    return ServerDeps(
        MockProfileSource({}),
        TokenSigner("snapshot-only-secret"),
        InMemoryAuditSink(),
        knowledge=knowledge,
    )


async def build_snapshots() -> dict[str, dict[str, Any]]:
    snapshots: dict[str, dict[str, Any]] = {}
    for name, server in build_servers(_snapshot_deps()).items():
        tools = await server.list_tools()
        snapshots[name] = {
            "server": name,
            "instructions": server.instructions,
            "tools": [
                tool.model_dump(
                    mode="json",
                    by_alias=True,
                    include={"name", "description", "input_schema", "output_schema"},
                )
                for tool in sorted(tools, key=lambda t: t.name)
            ],
        }
    return snapshots


def render(snapshot: dict[str, Any]) -> str:
    return json.dumps(snapshot, indent=2, ensure_ascii=False) + "\n"


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Snapshot narzędzi serwerów MCP.")
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT_DIR, help="katalog docelowy")
    parser.add_argument("--check", action="store_true", help="nie zapisuj, tylko porównaj")
    args = parser.parse_args(argv)

    stale: list[str] = []
    for name, snapshot in asyncio.run(build_snapshots()).items():
        path = args.out / f"{name}.json"
        content = render(snapshot)
        if path.exists() and path.read_text(encoding="utf-8") == content:
            continue
        if args.check:
            stale.append(str(path))
            continue
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8", newline="\n")
        print(f"zapisano {path}")
    if stale:
        print("Nieaktualne snapshoty MCP (uruchom: python tasks.py schemas):", *stale, sep="\n  ")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
