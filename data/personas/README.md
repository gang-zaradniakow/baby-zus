# Persony testowe i sprawy golden (T1–T12)

Każdy plik `TNN_opis.json` to jedna persona ze scenariusza §10.1 dokumentu założeń.
Ten sam plik czytają:

- mock `ProfileSource` (ZUS-30/31) – sekcja `profile`, czyli dane z „backendu”,
- test golden `packages/rules_engine/tests/test_golden.py` – sekcje `expected` i `stage`,
- testy asystenta (ZUS-54/55) – sekcja `level2` (T11, T12).

Model i loader: `profile_source.personas` (`Persona`, `load_personas`).

## Format

| Pole | Zawartość |
|---|---|
| `id` | `T01`…`T12`; nazwa pliku musi zaczynać się od `id_` |
| `scope` | `ENGINE` – wynik sprawdza silnik; `LEVEL2` – scenariusz dla asystenta |
| `source` | `kind`: `MANUAL` (wyliczenie ręczne) albo `ZUS_CASE` (wtedy `document` i `page`); `note` – jak policzono |
| `today` | dzień „dziś” dla wyliczeń – sprawy nie zależą od daty uruchomienia testów |
| `profile` | profil w formacie kontraktu `Profile` (`docs/contracts/profile.schema.json`) |
| `stage` | oczekiwany etap E0–E3 i flagi (opcjonalnie) |
| `expected[]` | dla każdej intencji: `verdict` **albo** `unsupported: true`; opcjonalnie `missing`, `summaryContains`, `warningsContain`, `calculation` |
| `level2` | pytanie, ewentualny tekst z dokumentu (`untrustedText`) i oczekiwane zachowanie |

W `calculation` sprawdzane są tylko podane pola (`base`, `rate`, `monthly`, `total`,
`periods` z `type`, `from`, `to` i opcjonalnie `rate`, `amount`). Kwoty – co do grosza.

## Persona → dane dla mocków MCP i API

Mock `ProfileSource` udostępnia personę pod kluczem `profileId` (`persona-t01` … `persona-t12`).
Razem persony pokrywają każdy rodzaj danych potrzebny serwerom MCP (`zus-ubezpieczenia`,
`zus-ezla`, `zus-naleznosci`, `profil`) – pilnuje tego `test_personas_cover_data_needed_by_mocks`.

| Persona | Wnioskodawca – ubezpieczenie | Dane dla mocków |
|---|---|---|
| T01 | matka, umowa o pracę, chorobowe obowiązkowe od 02.01.2023 | płatnik 45 osób (> 20), poród 12.11.2026 |
| T02 | matka, zlecenie, chorobowe dobrowolne od 01.09.2026 | e-ZLA z kodem B, ciąża (PDP 15.02.2027) |
| T03 | matka, JDG, chorobowe dobrowolne od 01.01.2024 | zadłużenie składkowe 350,00 zł |
| T04 | matka, zlecenie obowiązkowe 01.01.2024–30.09.2026 | okres zakończony (`endReason` OTHER) przed porodem |
| T05 | matka, umowa o pracę 01.03.2022–31.08.2026 | ustanie przez likwidację pracodawcy, ciąża (PDP 10.12.2026) |
| T06 | matka, umowa o pracę od 02.01.2023 | płatnik 12 osób (≤ 20 → wypłaca ZUS), bliźnięta, „Za życiem” |
| T07 | matka, umowa o pracę od 02.01.2023 | zdarzenie STILLBIRTH (flaga DIFFICULT) |
| T08 | **ojciec**, umowa o pracę od 02.01.2023 | partnerka zadeklarowana (źródło USER) **bez zgody**, zdarzenie MOTHER_HOSPITALIZATION |
| T09 | matka, umowa o pracę od 02.01.2023 | partner z ZUS **ze zgodą** (12 × 9000,00 zł, płatnik 8 osób), plan urlopu z pracą ½ etatu |
| T10 | matka, umowa o pracę od 02.01.2023 | przyjęcie dziecka (ADOPTION, 02.11.2026) |
| T11 | matka, JDG **bez chorobowego** od 01.02.2025 | zadłużenie 0,00 zł; pytanie spoza katalogu (poziom 2) |
| T12 | matka, umowa o pracę od 02.01.2023 | dokument z wstrzykniętym poleceniem (poziom 2) |

Persony nie zawierają PESEL ani innych 11-cyfrowych numerów (`test_personas_never_contain_pesel_like_numbers`).

## Zasady

- Oczekiwane wartości liczymy **niezależnie od silnika** (ręcznie, rachunek w `source.note`).
  Skopiowanie wyniku z silnika do pliku sprawia, że test niczego nie sprawdza.
- Gdy przyjdzie sprawa ZUS (PDF w `data/cases_zus/`, poza gitem): podmień `expected` na
  rozstrzygnięcie ZUS i ustaw `source` na `{"kind": "ZUS_CASE", "document": "…", "page": N,
  "note": "…"}`. Do repozytorium trafia tylko zanonimizowany profil – bez PESEL, imion, adresów.
- Różnica w teście golden oznacza błąd w regule **albo** w wyliczeniu ręcznym – komunikat
  wskazuje personę i źródło, sprawdź oba.
