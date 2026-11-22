# Eksport treści z makiety

Treści tylko do odczytu pochodzą z makiety frontendu:
- `knowledge.json`: zakładka „Wiedza” (rozdziały i artykuły z `js/wiedza.js`),
- `dictionaries.json`: słowniczek formularzy, ciekawostki, organizacje wsparcia, telefony, przydatne strony (`js/data.js`) i karty tygodnia (`js/wiedza.js`).

```bash
node tools/content/export-content.mjs "<katalog makiety mZUS-dla-Rodzica>"
```

- Skrypt zapisuje `src/main/resources/content/*.json`. Pliki są w repozytorium, więc aplikacja nie potrzebuje Node.
- Klucze linków artykułów (`links: ['rodzice']`) są zamieniane na `{ url, label }`, a `action` na `{ href, label }`.
- Karta tygodnia musi wskazywać istniejący artykuł. Górna granica 999 miesięcy (ostatnia karta dziecka) oznacza „bez limitu” i nie trafia do pliku.
- Pliki czytają `JsonKnowledgeCatalog` i `JsonDictionaryCatalog` przy starcie. Błędna treść (np. zduplikowany identyfikator) zatrzymuje start aplikacji.
- Plików JSON nie poprawiamy ręcznie. Zmiana treści = zmiana w makiecie i ponowny eksport.
