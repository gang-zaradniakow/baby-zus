# Asystent AI dla ZUS – warstwa backendowa

Asystent podpowiada rodzicom, jakie zasiłki im przysługują (ciąża, macierzyństwo, rodzicielstwo,
adopcja), ile wyniosą i co trzeba załatwić. **Liczby daje deterministyczny silnik reguł, słowa
daje LLM.** Wymagania: [`docs/requirements.md`](docs/requirements.md).

## Wymagania

- Python **3.14** (`.python-version`)
- git
- Docker i docker compose – do uruchomienia usług i testów `integration` (bez Dockera są pomijane)
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

## Uruchomienie w Dockerze

```powershell
copy .env.example .env        # uzupełnij klucze; .env nigdy nie trafia do repozytorium
docker compose up --build     # db (Postgres 17 + pgvector) i api na http://localhost:8000
docker compose ps             # wszystkie usługi powinny mieć stan „healthy”
```

Automatyczne sprawdzenie (to samo robi job „docker compose up” w PR na runnerze z Dockerem):
`python tasks.py compose-smoke` – buduje i uruchamia usługi w osobnym projekcie na portach
18000/18001/15432, czeka aż `db`, `api` i `mcp_servers` będą zdrowe, sprawdza migracje,
`/health` i kartę B.01 dla persony T01, a na końcu sprząta (`KEEP=1` zostawia usługi).

Obraz każdej aplikacji buduje ten sam wieloetapowy `Dockerfile` (`python:3.14-slim`) z
argumentem `APP` (domyślnie `api`, np. `docker build --build-arg APP=admin .`). CI buduje
i publikuje obraz `api` jako `$IMAGE:<sha>` (`.forgejo/workflows/ci.yml`). W obrazie są
persony z `data/personas`, więc `PROFILE_SOURCE=mock` działa bez backendu profilu.
Rozszerzenie `vector` w nowej bazie tworzy `docker/postgres/init/01-extensions.sql`.

Migracje bazy (Alembic, skrypty w `apps/api/src/api/db/migrations`) uruchamia w compose
jednorazowa usługa `migrate`. Poza Dockerem: `python -m api.db.migrate upgrade head`
(adres z `DATABASE_URL`), `downgrade base` cofa wszystko, `--sql` tylko wypisuje SQL.
Testy z prawdziwym Postgresem (`integration`, testcontainers) są pomijane, gdy Docker
jest niedostępny.

## Demo poziomu 1 (bez AI)

Po `docker compose up` (albo `uvicorn api.main:app` z bazą) – dokumentacja API: http://localhost:8000/docs.

```powershell
$api = "http://localhost:8000"
$login = Invoke-RestMethod -Method Post "$api/auth/mobywatel" -ContentType application/json -Body '{"userRef":"persona-t01"}'
$h = @{ Authorization = "Bearer $($login.token)" }
Invoke-RestMethod "$api/me/stage" -Headers $h                    # etap i flagi
Invoke-RestMethod "$api/intents?stage=E2"                         # 5–8 pytań dla etapu
Invoke-RestMethod -Method Post "$api/answers" -Headers $h -ContentType application/json `
  -Body '{"intentId":"B.01_wysokosc_macierzynskiego"}'            # karta z silnika
```

- `POST /auth/mobywatel` – symulowane logowanie (persony `persona-t01`…`persona-t12`),
  `POST /auth/anonymous` – tryb bez logowania (formularz profilu, źródło `USER`).
- `POST /answers` zwraca `{"kind": "CARD", "card": …}` albo `{"kind": "UNSUPPORTED", …}`
  (brak reguły w silniku → czat lub urzędnik).
- Karta NEED_INFO wymienia brakujące pola (`missing[].field`, np. `child.birthDate`);
  uzupełnia się je przez `PATCH /me/profile` albo `supplements` w `POST /answers`.

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
data/       personas (T1–T12: profile + sprawy golden), knowledge; cases_zus/ poza gitem
docs/       wymagania, ADR, kontrakty (schema, OpenAPI)
scripts/    narzędzia pomocnicze
docker/     pliki dla usług compose (init bazy)
tests/e2e/  scenariusze end-to-end
```

## Kontrakty danych

Modele są w `packages/contracts` (AnswerCard, Profile, Intent, StageInfo). JSON Schema dla
frontendu i backendu leży w `docs/contracts/*.schema.json`, a przykłady w `docs/contracts/examples/`.
Po zmianie modeli: `python tasks.py schemas` (test pilnuje, żeby pliki były aktualne).

Dane profilu pochodzą z zewnętrznego backendu innego zespołu (U8). API i serwery MCP znają
tylko port `profile_source.ProfileSource`; adapter wybiera `PROFILE_SOURCE`: `mock` (persony
z `data/personas`, klucz `persona-t01` itd.) albo `http` (`BACKEND_URL`, `BACKEND_API_KEY`,
`BACKEND_TIMEOUT_S`, `BACKEND_MAX_ATTEMPTS`). Proponowany kontrakt backendu to
`docs/contracts/backend-profile.openapi.json` – generuje go `python tasks.py schemas`.

## Konwencje

- **Instalacja aplikacji z jej katalogu.** pip liczy ścieżki `-e ../../packages/...` względem
  bieżącego katalogu, nie pliku – dlatego `cd apps/api && pip install -r requirements.txt`
  (`tasks.py` i Dockerfile robią to same).
- **Narzędzia z `.venv` bez aktywacji:** `tasks.py` wywołuje je po ścieżce
  (`.venv\Scripts\` na Windows, `.venv/bin/` gdzie indziej).
- **Nazwy dystrybucji mają prefiks `zus-`** (np. `zus-contracts`), a nazwy importów są krótkie
  (`import contracts`). Prefiks chroni przed pobraniem obcego pakietu o tej samej nazwie z PyPI.
- **Wersje:** `requirements.txt` przypinają dokładne wersje (`==`), `pyproject.toml` deklaruje zakresy.
- **Styl:** ruff (lint + format, linia 100 znaków), mypy `--strict` dla `contracts`, `rules_engine` i `profile_source`.
- **Testy:** pytest, pokrycie ≥ 80% (próg w `pyproject.toml`), markery `integration`, `e2e`,
  `live_llm` (domyślnie wyłączone), `golden`. Ostrzeżenia traktowane jako błędy.
- **Daty:** kod nie woła `date.today()` – datę dostaje jako argument.
- **Sekrety:** tylko w `.env` (wzór: `.env.example`), nigdy w repozytorium.
