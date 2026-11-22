# ADR 0002: Wybór modelu LLM i embeddingów

- **Status:** Proponowana – kandydat wybrany, czeka na wyniki pomiarów (ZUS-05)
- **Data:** 2026-11-21
- **Dotyczy:** ZUS-50 (LLMClient), ZUS-35 (RAG), ZUS-56 (testy na żywym modelu)

## Kontekst

- Nie hostujemy modelu sami – korzystamy z API zgodnego z OpenAI (ustalenie U6: model
  wymienny konfiguracją `LLM_BASE_URL` / `LLM_MODEL`).
- Pierwotny plan (Bielik v3 na CloudFerro Sherlock) jest zablokowany: panel CloudFerro
  odrzuca dostęp („The requested URL was rejected”, 21.11.2026).
- Alternatywa: **OVHcloud AI Endpoints**, model **`Olala-v1.0-mini-7A1B`** – model
  rozumujący (MoE, 6,8 mld parametrów, 1,5 mld aktywnych), kontekst 32k, structured output
  (`json_object`, `json_schema`), function calling, w katalogu oznaczony jako bezpłatny.
  Ręczne testy w Playground wypadły bardzo dobrze. Model jest nowy (w katalogu od 18.11.2026),
  a strona nie podaje obsługiwanych języków – polszczyznę trzeba zmierzyć.
- API ma parametr `reasoning_effort` (`none`, `minimal`, `low`, `medium`, `high`, `xhigh`, `max`).
  Rozumowanie trafia do osobnego pola `reasoning`; `content` zawiera samą odpowiedź.
- LLM ma w systemie trzy zadania: **klasyfikację intencji** (JSON wg schematu), **wyjaśnienie
  wyniku silnika** (1–2 zdania, bez własnych liczb) i **streszczenie do eskalacji**.
  Liczb nie liczy – robi to silnik.
- Budżet czasu z §10.2: odpowiedź z LLM < 5 s (razem z MCP i silnikiem).

## Rozważane opcje

| Rola | Kandydaci |
|---|---|
| Czat (domyślny) | `Olala-v1.0-mini-7A1B` (OVHcloud) – kandydat główny |
| Czat (zapasowy) | Bielik 11B v3 (Sherlock po odblokowaniu, SentiOne), PLLuM – przez konfigurację |
| Embeddingi | modele z `GET /models` u wybranego dostawcy (np. `bge-multilingual-gemma2`) |

`Olala-v1.0-summarise` odrzucony bez pomiarów: model do streszczania dokumentów, nie do
klasyfikacji i krótkich wyjaśnień.

## Kryteria (ustalone PRZED pomiarami)

Pomiary: `scripts/spike_llm.py` → `docs/spikes/zus-05-llm/report.md`.

### Model czatu i poziom rozumowania

Każdy poziom `reasoning_effort` oceniamy osobno. **Wybieramy najniższy poziom, który spełnia
K1–K3** – rozumowanie kosztuje czas i tokeny, a zadania są proste. Poziom może być różny dla
klasyfikacji i dla wyjaśnień (konfiguracja w ZUS-50).

| # | Kryterium | Próg | Dlaczego |
|---|---|---|---|
| K1 | JSON zgodny ze schematem (najlepszy działający tryb) | ≥ 19/20 | Klasyfikacja musi być parsowalna; ponowienie kosztuje czas |
| K2 | Trafność intencji | ≥ 17/20, w tym **4/4** pytań spoza katalogu | Fałszywe „pasuje do katalogu” jest gorsze niż eskalacja |
| K3 | Opóźnienie p95: klasyfikacja / wyjaśnienie | ≤ 2 s / ≤ 3 s | Zostaje ~1 s na MCP, silnik i walidator przy budżecie 5 s |
| K4 | Wyjaśnienia z obcymi liczbami | informacyjnie; > 2/6 → ostrzejszy prompt | Walidator (ZUS-53) je odrzuci, ale każde odrzucenie to ponowienie |
| K5 | Jakość polszczyzny (ocena ręczna 6 wyjaśnień, 1–5) | średnio ≥ 4 | Ton z §9.3; model nie jest polskojęzyczny z założenia |
| K6 | Koszt / limity | informacyjnie | Model bezpłatny – liczą się limity zapytań |

Jeśli Olala nie spełni K1–K3 na żadnym poziomie albo K5 < 4 – wracamy do Bielika
(innym dostawcą) i powtarzamy pomiar tym samym skryptem (`--base-url`, `--chat-models`).

### Embeddingi

| # | Kryterium | Próg |
|---|---|---|
| E1 | top-3 na 12 polskich zapytaniach | ≥ 11/12 |
| E2 | MRR | najwyższy wygrywa |
| E3 | Czas embeddingu 12 zapytań | ≤ 1 s |
| E4 | Wymiar wektora | informacyjnie – patrz konsekwencje dla pgvector |

Jeśli u OVHcloud nie ma modelu embeddingów spełniającego E1, RAG (ZUS-35) dostaje osobny
`EmbeddingClient` z innym dostawcą – interfejsy są rozdzielone właśnie po to.

### Limity

Jeśli limit zapytań jest niższy niż ~30/min albo seria 8 równoległych zapytań daje 429:
`LLMClient` (ZUS-50) dostaje ogranicznik równoległości i kolejkę, a testy `live_llm`
(ZUS-56) – przerwy między wywołaniami. Rozważamy też klucz API (wyższe limity niż dostęp
anonimowy).

## Wyniki

> Do uzupełnienia z `report.md`.

| Kryterium | effort=none | effort=low | effort=medium |
|---|---|---|---|
| K1 JSON zgodny ze schematem (tryb) | | | |
| K2 Trafność intencji (poza katalogiem) | | | |
| K3 p95 klasyfikacja / wyjaśnienie [s] | | | |
| Tokeny rozumowania (śr.) | | | |
| Czas do pierwszego tokenu [s] | | | |
| K4 Obce liczby | | | |
| K5 Polszczyzna (1–5) | | | |

| Embeddingi | Wymiar | top-1 | top-3 | MRR | Czas zapytań [s] |
|---|---|---|---|---|---|
| | | | | | |

Limity (nagłówki, liczba 429, seria): …

## Decyzja

> Do uzupełnienia. Hipoteza robocza: `Olala-v1.0-mini-7A1B`, tryb `json_schema`,
> `reasoning_effort` = najniższy poziom spełniający K1–K3; Bielik jako zapasowy w konfiguracji.

## Konsekwencje

- **ZUS-50:** `LLMClient` przekazuje `reasoning_effort` (konfigurowalny osobno dla klasyfikacji
  i wyjaśnień) i czyta wyłącznie `content` – pole `reasoning` nigdy nie trafia do karty
  ani do walidatora. `capabilities.json_schema` wg wyniku K1. Timeout z zapasem nad p95.
- **Dane osobowe:** dane wychodzą do OVHcloud – pseudonimizacja przed promptem (ZUS-54)
  obowiązkowa. Lokalizację przetwarzania (wymóg EOG z §9.1) i warunki retencji potwierdzić
  w dokumentacji OVHcloud AI Endpoints przed użyciem prawdziwych danych.
- **Ryzyko dostawcy:** model nowy i bezpłatny – warunki mogą się zmienić. Mitygacja:
  wymiana modelu konfiguracją, ten sam skrypt pomiarowy dla następcy.
- **ZUS-35 (pgvector):** w ZUS-02 przyjęto obraz `pgvector/pgvector:0.8.0-pg17`. Kolumna
  `vector` mieści do 16 000 wymiarów, ale indeksy HNSW i IVFFlat obsługują najwyżej
  2 000 wymiarów dla `vector` i 4 000 dla `halfvec`. Typowe modele wielojęzyczne (1024, 1536)
  mieszczą się w limicie. Przy wektorach o kilku tysiącach wymiarów: `halfvec`, wyszukiwanie
  bez indeksu (przy kilku tysiącach fragmentów wystarczy) albo model o mniejszym wymiarze.
- **ZUS-56:** pytania z tego spike'u są zalążkiem zestawu do testów `live_llm`.
