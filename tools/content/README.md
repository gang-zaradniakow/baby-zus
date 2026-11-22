# Eksport treści z makiety

Treści zakładki „Wiedza” (rozdziały i artykuły) pochodzą z makiety frontendu (`js/wiedza.js`).

```bash
node tools/content/export-knowledge.mjs "<katalog makiety mZUS-dla-Rodzica>"
```

- Skrypt zapisuje `src/main/resources/content/knowledge.json`. Plik jest w repozytorium, więc aplikacja nie potrzebuje Node.
- Klucze linków (`links: ['rodzice']`) są zamieniane na `{ url, label }`, a `action` na `{ href, label }`.
- Plik czyta `JsonKnowledgeCatalog` przy starcie. Zduplikowany identyfikator albo artykuł z nieznanego rozdziału zatrzymuje start aplikacji.
- Pliku JSON nie poprawiamy ręcznie. Zmiana treści = zmiana w makiecie i ponowny eksport.
