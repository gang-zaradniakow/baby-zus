# Asystent AI dla ZUS – warstwa backendowa

Asystent podpowiada rodzicom, jakie zasiłki im przysługują (ciąża, macierzyństwo, rodzicielstwo,
adopcja), ile wyniosą i co trzeba załatwić. **Liczby daje deterministyczny silnik reguł, słowa
daje LLM.** Wymagania: [`docs/requirements.md`](docs/requirements.md).

## Wymagania

- Python **3.14** (`.python-version`)
- git
- Docker i docker compose (od ZUS-02)
- `make` – opcjonalnie; wszystkie komendy są w `tasks.py` (sama biblioteka standardowa)

## Szybki start

**Windows (PowerShell)** – nie trzeba aktywować środowiska ani instalować `make`:

```powershell
cd zus-asystent
git init                      # potrzebne do hooków pre-commit
python tasks.py install       # .venv na 3.14 + narzędzia dev + pakiety i aplikacje + pre-commit
python tasks.py check         # = lint + test
```

**Linux / macOS:**

```bash
make install
make check
```

`python tasks.py help` (lub `make`) pokazuje wszystkie komendy; można podać kilka naraz:
`python tasks.py lint test`. Skrypt sam szuka Pythona 3.14 (bieżący interpreter, `py -3.14`,
`python3.14`); inny wskażesz zmienną `PYTHON`, np. w PowerShell:
`$env:PYTHON="C:\Python314\python.exe"; python tasks.py install`.

## Struktura

```
packages/   biblioteki współdzielone
  contracts/       modele Pydantic (AnswerCard, Profile, Intent)
  rules_engine/    silnik reguł – bez I/O, zależy tylko od contracts
  profile_source/  port + adaptery mock/http do zewnętrznego backendu
apps/       aplikacje (każda: pyproject.toml + requirements.txt + tests/)
  api/             FastAPI: poziom 1, czat, eskalacja
  mcp_servers/     serwery MCP z §7 (mocki)
  assistant/       orkiestrator LLM, walidator liczb, RAG
  admin/           panel tylko do odczytu
data/       golden (sprawy testowe), fixtures, knowledge; cases_zus/ poza gitem
docs/       wymagania, ADR, kontrakty (schema, OpenAPI)
scripts/    narzędzia pomocnicze
tests/e2e/  scenariusze end-to-end
```

## Kontrakty danych

Modele są w `packages/contracts` (AnswerCard, Profile, Intent, StageInfo). JSON Schema dla
frontendu i backendu leży w `docs/contracts/*.schema.json`, a przykłady w `docs/contracts/examples/`.
Po zmianie modeli: `python tasks.py schemas` (test pilnuje, żeby pliki były aktualne).

## Konwencje

- **Instalacja aplikacji z jej katalogu.** pip liczy ścieżki `-e ../../packages/...` względem
  bieżącego katalogu, nie pliku – dlatego `cd apps/api && pip install -r requirements.txt`
  (`tasks.py` i Dockerfile robią to same).
- **Narzędzia z `.venv` bez aktywacji:** `tasks.py` wywołuje je po ścieżce
  (`.venv\Scripts\` na Windows, `.venv/bin/` gdzie indziej).
- **Nazwy dystrybucji mają prefiks `zus-`** (np. `zus-contracts`), a nazwy importów są krótkie
  (`import contracts`). Prefiks chroni przed pobraniem obcego pakietu o tej samej nazwie z PyPI.
- **Wersje:** `requirements.txt` przypinają dokładne wersje (`==`), `pyproject.toml` deklaruje zakresy.
- **Styl:** ruff (lint + format, linia 100 znaków), mypy `--strict` dla `contracts` i `rules_engine`.
- **Testy:** pytest, pokrycie ≥ 80% (próg w `pyproject.toml`), markery `integration`, `e2e`,
  `live_llm` (domyślnie wyłączone), `golden`. Ostrzeżenia traktowane jako błędy.
- **Daty:** kod nie woła `date.today()` – datę dostaje jako argument.
- **Sekrety:** tylko w `.env` (wzór: `.env.example`), nigdy w repozytorium.
