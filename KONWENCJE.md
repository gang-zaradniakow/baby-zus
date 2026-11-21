# Konwencje projektu mZUS dla Rodzica (React Native / Expo)

Cel: kod jasny, atomowy, a położenie każdego pliku wynika z tego, co ten plik robi.

## 1. Jedno zadanie na plik

- Jeden komponent, hook albo funkcja to jeden plik i jedna odpowiedzialność.
- Jeśli opis pliku wymaga słowa „i” („renderuje listę **i** pobiera dane”), dzielimy go.
- Logikę (np. wyliczanie kolorów, terminów, kwot) wydzielamy do czystych funkcji obok komponentu.
  Przykład: `NavBarItem.tsx` (widok) + `resolveNavBarItemColors.ts` (logika).

## 2. Struktura katalogów

```
src/
  app/            Trasy Expo Router. TYLKO cienkie pliki: layouty i re-eksport ekranu.
  screens/        Ekrany: składają szablon + komponenty funkcji w całość.
  features/       Części należące do jednej funkcji aplikacji (np. onboarding, login):
    <funkcja>/      hooki ze stanem (`useOnboardingForm`) i komponenty tylko dla tej funkcji.
  components/     Uniwersalne klocki UI, niezależne od funkcji:
    atoms/          najmniejsze klocki (AppText, Button, Checkbox, ProgressBar…),
    molecules/      kilka atomów razem (NavBarItem, ChoiceCard, CheckboxRow…),
    organisms/      większe sekcje (NavBar),
    templates/      szkielety ekranów (ScreenLayout, CenteredLayout, StepLayout).
  navigation/     Nawigacja: lista zakładek, RootNavigator (kto widzi które ekrany).
  session/        Stan sesji: zalogowanie + profil rodzica (Context + Provider + hook).
  domain/         Logika biznesowa i typy — czysty TypeScript, bez Reacta.
  data/           Dane statyczne: opcje formularzy, później katalog świadczeń, persony.
  hooks/          Ogólne hooki wielokrotnego użytku (useToday).
  utils/          Ogólne funkcje pomocnicze, niezwiązane z ZUS (toggleInList, maskDateInput).
  theme/          Tokeny designu i motyw (paleta, kolory, ton, odstępy, typografia…).
```

Zasada zależności (strzałka = „może importować”):
`app → screens → features → components → theme`, a `domain`, `data` i `utils` może importować każdy.
`domain` nie importuje nic z UI. Niższa warstwa nigdy nie importuje wyższej.

Gdzie położyć nowy plik?
- Używany przez wiele funkcji → `components/`. Tylko przez jedną → `features/<funkcja>/`.
- Reguła biznesowa (np. „brak ubezpieczenia wyklucza inne formy”) → `domain/`.
- Lista opcji lub tekstów do wyświetlenia → `data/`.

## 3. Komponent = folder

```
components/molecules/NavBarItem/
  NavBarItem.tsx              widok
  NavBarItem.styles.ts        StyleSheet: tylko układ (rozmiary, odstępy, flex)
  resolveNavBarItemColors.ts  opcjonalnie: czysta logika komponentu
  index.ts                    publiczny eksport
```

- Ekran, który potrzebuje własnych stylów, też dostaje folder (`screens/LoginScreen/`). Prosty ekran może być pojedynczym plikiem.
- Importujemy przez folder: `import { NavBarItem } from '@/components/molecules/NavBarItem'`.
- Statyczny układ trzymamy w `*.styles.ts`. Kolory zależne od motywu dokładamy w komponencie z `useTheme()`.

## 4. Style i kolory

- Kolorystyka pochodzi z prototypu ZUS baby (`palette.ts`): zieleń `#11734B`, brzoskwinia `#FF8A8A`,
  grafit `#2D3748`, tło `#FBFBFD`, noc `#1A202C`.
- Komponenty nie używają kodów hex ani palety wprost, tylko kolorów semantycznych z `useTheme().colors`
  (`primary`, `accent`, `textMuted`…). Nowy kolor dodajemy najpierw do `palette.ts`, potem do `colors.ts`.
- Odstępy, zaokrąglenia, cienie i typografia pochodzą z tokenów (`spacing`, `radius`, `shadows`, `typography`),
  bez „magicznych liczb”.
- Tekst renderujemy wyłącznie przez `AppText` z `variant`.

## 5. Nazewnictwo

- Komponenty i pliki komponentów: `PascalCase`. Funkcje i hooki: `camelCase` (`useTheme`, `resolve…`).
- Kod (nazwy) po angielsku, teksty UI i komentarze po polsku.
- Pliki tras w `src/app/` mają polskie nazwy, bo tworzą adresy URL (`/swiadczenia`).
- Eksporty nazwane wszędzie poza plikami tras (Expo Router wymaga tam `default`).

## 6. Dostępność

- Elementy interaktywne mają `accessibilityRole` i `accessibilityLabel`. Stan zapisujemy w `accessibilityState`.

## 7. Przed zakończeniem kroku

```bash
npm run typecheck
npx expo lint
```

## 8. Sposób pracy

Rozwijamy aplikację małymi krokami. Każdy krok jest omawiany: co dodano, gdzie leży i dlaczego tam.
