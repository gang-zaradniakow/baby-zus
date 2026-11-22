# Baza wiedzy (RAG) – ZUS-35

Treści dla serwera MCP `wiedza` (`search_law`, `search_guides`, `list_support_orgs`).
Zgodnie z U2 treści są w repozytorium, a panel administracyjny tylko je pokazuje.

| Plik | Zawartość |
|---|---|
| `law.json` | **streszczenia** przepisów (Kodeks pracy, ustawa zasiłkowa) – nie cytaty; `url` = strona aktu w ISAP, ta sama co w rejestrze silnika (`rules_engine.params.base.ACT_URLS`) |
| `guides.json` | streszczenia poradników ZUS i gov.pl z adresem strony źródłowej |
| `support_orgs.json` | organizacje i materiały wsparcia z kategoriami: `żałoba`, `poronienie`, `wcześniaki`, `ciężka choroba dziecka` |

## Zasady

- Każdy fragment ma adres **https** (test `test_tm19_every_fragment_has_https_source`).
  Asystent cytuje tylko to, co ma źródło; bez źródła pytanie trafia do urzędnika (ZUS-55).
- `toVerify: true` – treść lub adres wymaga przeglądu (osoba znająca przepisy / sprawdzenie
  strony). Organizacja bez potwierdzonej strony ma `url: null` i jest pokazywana bez linku.
- Adresy poradników i organizacji sprawdzono 22.11.2026. Zmiana treści fragmentu zmienia
  jego `content_hash`, więc ponowne `python -m assistant.rag.ingest` przelicza embeddingi.

## Wczytanie

- `KNOWLEDGE_INDEX=memory` (domyślnie): serwer `wiedza` wczytuje korpus przy starcie.
- `KNOWLEDGE_INDEX=pgvector`: `python -m assistant.rag.ingest` zapisuje fragmenty i embeddingi
  do tabeli `knowledge_chunks` (migracja API 0002); model z `EMBEDDING_MODEL`.
