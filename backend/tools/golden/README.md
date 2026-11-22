# Testy zgodności z makietą (golden)

Oczekiwane wyniki obliczeń liczy makieta frontendu (`js/calc.js`), a testy Javy sprawdzają, że backend daje te same odpowiedzi.

```bash
node tools/golden/generate.mjs "<katalog makiety mZUS-dla-Rodzica>"
```

- Skrypt zapisuje `src/test/resources/golden/<obszar>.json`. Pliki są w repozytorium, więc testy nie potrzebują Node.
- Nowy obszar: dodaj funkcję do obiektu `areas` w `generate.mjs` (wejścia + wywołanie funkcji z `calc.js`), uruchom skrypt i w teście użyj `GoldenCases.load("<obszar>", Input.class, Expected.class)` jako `@MethodSource`.
- Strefa czasowa jest ustawiona na `Europe/Warsaw`, bo makieta liczy na lokalnych datach.
- Celowe odstępstwo od makiety (np. poprawiony błąd) opisujemy w teście jawnie: mapa `DEVIATIONS` (nazwa przypadku → oczekiwany wynik backendu) z komentarzem dlaczego, plus osobny test tego zachowania. Pliku JSON nie poprawiamy ręcznie — zawsze odzwierciedla makietę.
