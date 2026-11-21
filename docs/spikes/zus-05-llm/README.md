# Spike ZUS-05: LLM – instrukcja

Skrypt `scripts/spike_llm.py` robi pomiary potrzebne do ADR 0002 i zapisuje
`report.md` oraz `report.json` w tym katalogu. Wysyła wyłącznie dane syntetyczne.

Domyślny dostawca i model: **OVHcloud AI Endpoints**, `Olala-v1.0-mini-7A1B`
(`https://oai.endpoints.kepler.ai.cloud.ovh.net/v1`, API zgodne z OpenAI).

## 1. Sprawdzenie dostępu (sekundy)

```powershell
.venv\Scripts\python scripts\spike_llm.py --list-only --anonymous
```

Na ekranie pojawi się lista modeli. Jeśli API odrzuci zapytanie bez klucza (401/403),
utwórz klucz w panelu OVHcloud (AI Endpoints), wpisz go do `.env` (plik jest w `.gitignore`):

```
LLM_API_KEY=tu-wklej-klucz
```

i uruchamiaj dalej bez `--anonymous`.

## 2. Pełny pomiar (ok. 10–20 minut)

```powershell
.venv\Scripts\python scripts\spike_llm.py --anonymous
```

Domyślnie skrypt sprawdza Olalę mini na trzech poziomach `reasoning_effort` (`none`, `low`,
`medium`), w trzech trybach structured output, na 20 pytaniach – ok. 200 wywołań. Bez klucza
limity są zwykle niskie: skrypt czeka po każdym 429 i ponawia, więc przebieg potrwa dłużej,
a liczba 429 trafi do raportu.

Szybszy wariant (np. na start):

```powershell
.venv\Scripts\python scripts\spike_llm.py --anonymous --modes json_schema --reasoning-efforts none low --questions 10
```

| Opcja | Działanie |
|---|---|
| `--reasoning-efforts none low medium` | poziomy rozumowania do porównania; `default` = bez parametru |
| `--modes json_schema` | tylko wybrane tryby structured output |
| `--questions 10` | mniej pytań (1–20) |
| `--chat-models A B` | wskaż modele ręcznie (np. Bielika u innego dostawcy) |
| `--embedding-models X` | wskaż modele embeddingów ręcznie |
| `--burst 0` | pomiń test serii równoległych zapytań |
| `--price-in / --price-out` | ceny za 1M tokenów, jeśli model jest płatny |
| `--base-url URL` | inny dostawca zgodny z OpenAI (Sherlock, Ollama itd.) |

## 3. Co dalej

Prześlij `report.md` (i najlepiej `report.json`). Na tej podstawie uzupełnię ADR 0002:
wyniki, wybór poziomu `reasoning_effort` i wartości domyślne dla ZUS-50.
Jakość polszczyzny (K5) oceniasz Ty – w raporcie są przykładowe wyjaśnienia dla każdego
poziomu rozumowania.
