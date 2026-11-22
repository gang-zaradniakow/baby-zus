#!/usr/bin/env python3
"""Komendy deweloperskie monorepo – działają na Windows, macOS i Linux.

Użycie:  python tasks.py <komenda> [<komenda> ...]
Przykład: python tasks.py install
          python tasks.py lint test

Skrypt używa tylko biblioteki standardowej i sam znajduje narzędzia w .venv,
więc nie trzeba aktywować środowiska. Na Linux/macOS to samo robi `make <komenda>`.
"""

from __future__ import annotations

import os
import shutil
import subprocess
import sys
from collections.abc import Callable
from pathlib import Path

ROOT = Path(__file__).resolve().parent
VENV = ROOT / ".venv"
IS_WINDOWS = os.name == "nt"
BIN = VENV / ("Scripts" if IS_WINDOWS else "bin")
REQUIRED = (3, 14)

APPS = ["api", "mcp_servers", "assistant", "admin"]
# mypy --strict dla pakietów (contracts, rules_engine, profile_source); aplikacje zwykły.
STRICT_SRC = [
    "packages/contracts/src",
    "packages/rules_engine/src",
    "packages/profile_source/src",
]
OTHER_SRC = [*(f"apps/{app}/src" for app in APPS)]
CACHE_DIRS = [".pytest_cache", ".mypy_cache", ".ruff_cache", ".hypothesis", "htmlcov"]
CACHE_FILES = ["coverage.xml", ".coverage"]


# --- narzędzia pomocnicze -------------------------------------------------------------


def run(*args: str, cwd: Path = ROOT) -> None:
    shown = [Path(a).name if a.startswith(str(BIN)) else a for a in args]
    print(f"\n> {' '.join(shown)}" + (f"   (w {cwd.relative_to(ROOT)})" if cwd != ROOT else ""))
    sys.stdout.flush()
    code = subprocess.call(args, cwd=cwd)
    if code:
        sys.exit(code)


def tool(name: str) -> str:
    exe = BIN / (f"{name}.exe" if IS_WINDOWS else name)
    if not exe.exists():
        sys.exit(f"Nie znaleziono {exe}. Uruchom najpierw: python tasks.py install")
    return str(exe)


def venv_python() -> str:
    return tool("python")


def python_version_ok(cmd: list[str]) -> bool:
    check = f"import sys; sys.exit(0 if sys.version_info[:2] >= {REQUIRED} else 1)"
    try:
        return subprocess.call([*cmd, "-c", check], stderr=subprocess.DEVNULL) == 0
    except OSError:
        return False


def find_base_python() -> list[str]:
    """Interpreter 3.14 do utworzenia .venv: zmienna PYTHON, bieżący, `py -3.14` lub python3.14."""
    candidates: list[list[str]] = []
    if os.environ.get("PYTHON"):
        candidates.append([os.environ["PYTHON"]])
    candidates.append([sys.executable])
    if IS_WINDOWS and shutil.which("py"):
        candidates.append(["py", "-3.14"])
    if shutil.which("python3.14"):
        candidates.append(["python3.14"])
    for cmd in candidates:
        if python_version_ok(cmd):
            return cmd
    sys.exit(
        "Potrzebny Python 3.14. Zainstaluj go (Windows: `winget install Python.Python.3.14` "
        "albo python.org) lub wskaż ścieżkę: PYTHON=C:\\...\\python.exe python tasks.py install"
    )


# --- komendy --------------------------------------------------------------------------


def cmd_venv() -> None:
    """Utwórz .venv na Pythonie 3.14 (jeśli jeszcze nie istnieje)."""
    if (BIN / ("python.exe" if IS_WINDOWS else "python")).exists():
        if not python_version_ok([venv_python()]):
            sys.exit(f"{VENV} ma starszego Pythona niż 3.14 – usuń katalog .venv i powtórz.")
        print(f"Środowisko {VENV.name} już istnieje.")
        return
    base = find_base_python()
    run(*base, "-m", "venv", str(VENV))
    run(venv_python(), "-m", "pip", "install", "--quiet", "--upgrade", "pip")


def cmd_install() -> None:
    """Zainstaluj narzędzia dev i wszystkie aplikacje (edytowalnie) + hooki pre-commit."""
    cmd_venv()
    pip = [venv_python(), "-m", "pip", "install"]
    run(*pip, "-r", "requirements-dev.txt")
    # pip liczy ścieżki `-e ../../...` względem bieżącego katalogu (nie pliku),
    # więc każdą aplikację instalujemy z jej katalogu.
    for app in APPS:
        run(*pip, "-r", "requirements.txt", cwd=ROOT / "apps" / app)
    if (ROOT / ".git").exists():
        run(tool("pre-commit"), "install")
    else:
        print("\nBrak repozytorium git – pomijam `pre-commit install` (zrób `git init` i powtórz).")


def cmd_lint() -> None:
    """ruff (lint + kontrola formatowania) i mypy."""
    run(tool("ruff"), "check", ".")
    run(tool("ruff"), "format", "--check", ".")
    cmd_typecheck()


def cmd_format() -> None:
    """Sformatuj kod i zastosuj automatyczne poprawki ruff."""
    run(tool("ruff"), "format", ".")
    run(tool("ruff"), "check", "--fix", ".")


def cmd_typecheck() -> None:
    """mypy: --strict dla pakietów, zwykły dla aplikacji."""
    mypy = tool("mypy")
    run(mypy, "--strict", *STRICT_SRC)
    run(mypy, *OTHER_SRC)
    # katalogi testów osobno: pliki o tych samych nazwach w różnych pakietach
    for tests in sorted([*ROOT.glob("packages/*/tests"), *ROOT.glob("apps/*/tests")]):
        run(mypy, str(tests.relative_to(ROOT)))


def cmd_test() -> None:
    """Testy z pokryciem (próg 80%); bez live_llm i e2e."""
    run(tool("pytest"), "--cov", "--cov-report=term-missing", "--cov-report=xml")


def cmd_test_live() -> None:
    """Testy z prawdziwym modelem (wymaga LLM_API_KEY)."""
    if not os.environ.get("LLM_API_KEY"):
        sys.exit("Ustaw zmienną LLM_API_KEY.")
    run(tool("pytest"), "-m", "live_llm")


def cmd_test_e2e() -> None:
    """Testy end-to-end (wymagają `docker compose up`)."""
    run(tool("pytest"), "-m", "e2e", "tests/e2e")


def cmd_compose_smoke() -> None:
    """docker compose up + sprawdzenie zdrowia usług i poziomu 1 (wymaga Dockera, bash, jq)."""
    run("bash", "scripts/compose_smoke.sh")


def cmd_schemas() -> None:
    """Wygeneruj JSON Schema kontraktów, OpenAPI backendu profilu i snapshoty MCP."""
    run(venv_python(), "-m", "contracts.schema")
    run(venv_python(), "-m", "profile_source.openapi")
    run(venv_python(), "-m", "mcp_servers.snapshot")


def cmd_check() -> None:
    """Wszystko, co sprawdza CI (lint + test)."""
    cmd_lint()
    cmd_test()


def cmd_pre_commit() -> None:
    """Uruchom hooki pre-commit na wszystkich plikach."""
    run(tool("pre-commit"), "run", "--all-files")


def cmd_clean() -> None:
    """Usuń cache i raporty (zostawia .venv)."""
    for name in CACHE_DIRS:
        shutil.rmtree(ROOT / name, ignore_errors=True)
    for name in CACHE_FILES:
        (ROOT / name).unlink(missing_ok=True)
    for pattern in ("__pycache__", "*.egg-info"):
        for path in ROOT.rglob(pattern):
            if VENV not in path.parents and path.is_dir():
                shutil.rmtree(path, ignore_errors=True)
    print("Wyczyszczono cache i raporty.")


COMMANDS: dict[str, Callable[[], None]] = {
    "venv": cmd_venv,
    "install": cmd_install,
    "lint": cmd_lint,
    "format": cmd_format,
    "typecheck": cmd_typecheck,
    "test": cmd_test,
    "test-live": cmd_test_live,
    "test-e2e": cmd_test_e2e,
    "compose-smoke": cmd_compose_smoke,
    "schemas": cmd_schemas,
    "check": cmd_check,
    "pre-commit": cmd_pre_commit,
    "clean": cmd_clean,
}


def print_help() -> None:
    print(__doc__)
    print("Komendy:")
    for name, func in COMMANDS.items():
        print(f"  {name:<11} {(func.__doc__ or '').strip()}")


def main(argv: list[str]) -> None:
    if not argv or argv[0] in {"-h", "--help", "help"}:
        print_help()
        return
    unknown = [a for a in argv if a not in COMMANDS]
    if unknown:
        print_help()
        sys.exit(f"\nNieznana komenda: {', '.join(unknown)}")
    for name in argv:
        COMMANDS[name]()


if __name__ == "__main__":
    main(sys.argv[1:])
