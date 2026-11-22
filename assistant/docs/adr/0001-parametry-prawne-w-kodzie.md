# ADR 0001: Parametry prawne w kodzie, wersjonowane datą wejścia przepisów w życie

- **Status:** Przyjęta
- **Data:** 2026-11-21
- **Dotyczy:** ZUS-10 (i wszystkie kalkulatory silnika)

## Kontekst

Stawki, wymiary urlopów, okresy wyczekiwania i limity wynikają z ustaw (§6.1). Dokument
założeń mówi jednocześnie o „parametrach w kodzie” (§1 pkt 5) i o „zmianie w panelu bez
wdrożenia” (§10.2). Ustalenie U1: **parametry są w kodzie**, panel tylko je wyświetla.

Przepisy zmieniają się w czasie, a sprawy dotyczą zdarzeń z przeszłości – rodzic dziecka
urodzonego w 2024 r. może dziś być na urlopie rodzicielskim, który rozlicza się według
przepisów z dnia porodu.

## Decyzja

- Każdy zestaw parametrów to osobny moduł `rules_engine/params/vRRRR_MM_DD.py`, nazwany
  **datą wejścia przepisów w życie**, z `valid_from` i `valid_to` (włącznie).
- Każdy parametr ma wartość, opis i co najmniej jedną podstawę prawną (akt + artykuł + link
  do ISAP). Kwoty i stawki to `Decimal`; `float` jest odrzucany.
- Nowy zestaw powstaje przez `dataclasses.replace(poprzedni, ...)` – w module widać tylko
  zmiany. Starych zestawów nie edytujemy ani nie komentujemy.
- `get_params(data_zdarzenia)` wybiera zestaw; zdarzenie sprzed pierwszego zestawu daje
  `NoParamsForDateError` (sprawa poza zakresem → eskalacja).
- `version_id` = `params-<valid_from>` trafia do `AnswerCard.engine_version`.
- Rejestr jest sprawdzany przy imporcie: zestawy uporządkowane, bez luk i nakładania,
  otwarty tylko ostatni.

## Zestawy na dziś

| Wersja | Od | Do | Co się zmieniło |
|---|---|---|---|
| `params-2023-04-26` | 26.04.2023 | 18.03.2025 | stan po nowelizacji work-life balance (41/43 tyg., 9 tyg. nieprzenoszalnych, 81,5% / 70%) |
| `params-2025-03-19` | 19.03.2025 | — | + uzupełniający urlop macierzyński (do 8 / 15 tyg., 100%) |

Nie tworzymy zestawów dla zmian, które nie ruszają wartości: 6.08.2025 (dokumenty przy
martwym urodzeniu) i zapowiadane połączenie formularzy ZAM/ZUR/ZAO w jeden ZAM. Formularze
to procedura (kategoria G), nie parametr kalkulacji – obsłużymy je w ZUS-14.

## Konsekwencje

- Zmiana przepisów = nowy moduł + commit + wdrożenie. Kryterium z §10.2 („zmiana w panelu
  bez wdrożenia”) zastępujemy: „zmiana przepisów nie wymaga zmian w logice silnika”.
- Test `test_params_values.py` zawiera niezależny odpis tabeli §6.1 – zmiana wartości
  w kodzie bez świadomej zmiany testu go obleje.
- Część podstaw prawnych ma flagę `to_verify` (podana ogólnie: domyślna stopa składek,
  urlop uzupełniający). Przed oddaniem – przegląd przez osobę znającą przepisy.
- Zdarzenia sprzed 26.04.2023 są poza zakresem; w razie potrzeby dokładamy starszy zestaw.
