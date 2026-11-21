# Funkcje mZUS dla Rodzica — co jest zrobione i gdzie

Mapa funkcji aplikacji względem gałęzi (branchy) i commitów. Dla każdej funkcji:
czym jest, jaki branch/commit ją wprowadził i jakie pliki za nią stoją.

**Ten plik aktualizuję przy każdej nowej zmianie** — nowa funkcja albo nowy branch
dostają własną sekcję, zanim commit zostanie opisany użytkownikowi jako gotowy.

---

## ⚠️ Rework w toku (od 2026-11-21)

Aplikacja jest przebudowywana pod nową koncepcję (`Downloads/mZUS-dla-Rodzica (1) (1)`,
HackNation 2026) — inny zakres (tylko świadczenia z ubezpieczenia chorobowego, bez
gminnych/rodzinnych) i inna struktura zakładek (Start, **Wiedza**, Asystent,
**Kalkulator**, Więcej — zamiast Start/Świadczenia/Asystent/Wiadomości/Więcej).
Pełny plan faz: `C:\Users\mohil\.claude\plans\humble-shimmying-brooks.md`.

Sekcje niżej oznaczone **[ZASTĄPIONE]** opisują funkcje, które rework usuwa albo
zastępuje nową wersją — zostają w dokumencie jako historia, dopóki dany kawałek
rework nie zostanie zrobiony.

**Mapa faz rework** (każda = własny branch/PR):

| Faza | Branch | Czym jest | Status |
|---|---|---|---|
| 0 | — | Porządki: usunięcie `feat/ekran-swiadczenia`, ten wpis w FUNKCJE.md | ✅ |
| 1 | `feat/guest-mode` | Nowe taby, tryb gościa (profil bez logowania), RootNavigator bez wymuszonych strażników | ✅ |
| 2 | `feat/guest-survey` | Ankieta gościa — do 9 kroków (rola, etap, data, [data urodzenia przy adopcji], liczba dzieci, sytuacje specjalne, zatrudnienie, [płatnik], drugi rodzic, imiona) | ✅ |
| 3 | `feat/knowledge-base` | Zakładka Wiedza — 7 rozdziałów, 30 artykułów Poradnika ZUS, wyszukiwarka | ✅ |
| 4 | `feat/calculator` | Zintegrowany kalkulator zasiłku (zbieg tytułów, Z-3, adopcja, „za życiem”, wcześniak, praca na urlopie) | ✅ |
| 5 | `feat/more-hub` | Więcej jako hub: Moje dane z ZUS, Wiadomości, Dzieci, Kontakt, Ustawienia, O aplikacji, Wsparcie, Panel demo, Panel administracyjny (mock) | ⏳ |
| 6 | `feat/assistant` | Asystent — wyszukiwanie w bazie wiedzy (bez AI) | ⏳ |
| 7 | `feat/wizards` | Kreatory wniosków/urlopów + „Sprawdź sprawę” (mock, bez PDF) | ⏳ |

---

## Motyw i design system

- **Branch/commit:** `d2ca630 feat(theme): tokeny designu z prototypu ZUS baby i tryb jasny/ciemny` (main)
- **Czym jest:** Jedyne źródło kolorów, odstępów, typografii i zaokrągleń. Komponenty nie
  używają hexów wprost, tylko tokenów z `useTheme()`.
- **Pliki:**
  - `src/theme/palette.ts` — surowe kolory z prototypu (zieleń, brzoskwinia, grafit…).
  - `src/theme/colors.ts` — kolory semantyczne (`primary`, `textMuted`…) w trybie jasnym i ciemnym.
  - `src/theme/tone.ts` — `resolveTone()`: zamienia nazwę tonu (`primary`/`accent`/…) na konkretne kolory.
  - `src/theme/spacing.ts`, `radius.ts`, `shadows.ts`, `typography.ts` — tokeny odstępów, zaokrągleń, cieni, wariantów tekstu.
  - `src/theme/ThemeProvider.tsx` + `ThemeContext.ts` + `useTheme.ts` — dostawca motywu i hook do niego.

## Dolna nawigacja (NavBar)

- **Branch/commit:** `8ac33fb feat(nav): dolny pasek nawigacji z 5 zakładkami mZUS` (main);
  zakładki zamienione w Fazie 1 (`7b0a641 feat(nav): nowe zakładki Wiedza i Kalkulator zamiast
  Świadczeń i Wiadomości`, branch `feat/guest-mode`).
- **Czym jest:** Pasek zakładek: Start, **Wiedza**, Asystent, **Kalkulator**, Więcej (było:
  Start, Świadczenia, Asystent, Wiadomości, Więcej).
- **Pliki:**
  - `src/navigation/tabs.ts` — `TABS`, jedyne źródło prawdy o zakładkach (nazwa, ikona, trasa, ton).
  - `src/components/organisms/NavBar/` — pasek: dzieci + rola `tablist` + margines bezpieczny.
  - `src/components/molecules/NavBarItem/` — jedna zakładka (ikona + etykieta), kolory liczy `resolveNavBarItemColors.ts`.
  - `src/app/(tabs)/_layout.tsx` — łączy routing (`expo-router/ui`) z wyglądem (`NavBar` + `NavBarItem`).
  - `src/app/(tabs)/wiedza.tsx`, `kalkulator.tsx` — nowe trasy (re-eksportują `KnowledgeScreen`/`CalculatorScreen`, na razie zaślepki).

## Kalendarz i strażnik terminów

- **Branch/commit:** `5b18934 feat(domain): kalendarz, dni wolne i strażnik terminów urzędowych` (main)
- **Czym jest:** Czysta logika dat: dni wolne (z Wigilią od 2025), liczenie dni roboczych,
  parsowanie polskich dat, wyliczanie terminu („po” vs „przed”).
- **Pliki:**
  - `src/domain/dates/` — `holidays.ts`, `workingDays.ts`, `calendarDate.ts`, `parsePolishDate.ts`, `formatDate.ts`, `age.ts`.
  - `src/domain/deadlines/` — `Deadline.ts` (typ), `deadlines.ts` (wyliczanie terminu wiążącego).

## Profil rodzica

- **Branch/commit:** `2fe1254 feat(profile): model profilu rodzica i reguły formularza` (main);
  rozszerzony w Fazie 2 (branch `feat/guest-survey`): `7468fd8 feat(profile): model profilu
  rozszerzony pod 9-krokową ankietę gościa`, `fd796b6` (płatnik), `8ce58f0` (adopcja).
- **Czym jest:** Model danych o sytuacji rodzica i reguły walidacji ankiety. Od Fazy 2: `role`
  (mama/tata/opiekun), `childrenCount` (1/2/3+), `partner` (track/notrack/single — zastępuje dawną
  sytuację szczególną `single`), opcjonalnie `payerSize`, `childBirthDate` (adopcja), `name`,
  `childName`. Sytuacje szczególne: `abroad`, `disability`, `preterm`, `zazyciem`.
- **Pliki:**
  - `src/domain/profile/ParentProfile.ts` — typ profilu.
  - `src/domain/profile/insuranceFlags.ts` — czy dana forma zatrudnienia daje ubezpieczenie chorobowe.
  - `src/domain/profile/hasExternalPayer.ts` — czy rodzic ma płatnika (umowa o pracę / zlecenie).
  - `src/domain/profile/resolveBenefitPayer.ts` — kto wypłaca zasiłek: pracodawca (21+ osób, „nie wiem”)
    albo ZUS (do 20 osób, sama firma). Używa go `TimelineContext`.
  - `src/domain/profile/describeStage.ts` — opis etapu („ciąża, 28. tydzień” itp.) po polsku.
  - `src/domain/profile/toggleEmployment.ts`, `validateEventDate.ts`, `validateChildBirthDate.ts` — logika ankiety.

## Ankieta gościa (onboarding)

- **Branch/commit:** `48b5731 feat(onboarding): 4-etapowy kreator sytuacji rodzica` (main);
  przebudowana w Fazie 2 (branch `feat/guest-survey`): `6930e23` (lista kroków, rola, liczba
  dzieci), `fd796b6` (płatnik), `1ee4891` (drugi rodzic), `4593cb8` (imiona), `8ce58f0` (adopcja).
- **Czym jest:** Ankieta wg prototypu (ONB w app.js), dostępna bez logowania („Sprawdź bez
  logowania” na Starcie). Kroki: rola → etap → data → [data urodzenia dziecka, tylko adopcja] →
  liczba dzieci → sytuacje szczególne → zatrudnienie → [płatnik, tylko umowa o pracę/zlecenie] →
  drugi rodzic → imiona (opcjonalne). 7–9 kroków zależnie od odpowiedzi. Kroki z kartami wyboru
  przechodzą dalej same; ostatni krok zawsze ma „Zakończ”.
- **Pliki:**
  - `src/features/onboarding/onboardingSteps.ts` — kolejność kroków, warunki `showIf`, które kroki przechodzą same.
  - `src/features/onboarding/onboardingDraft.ts` — typ szkicu odpowiedzi i pusty szkic.
  - `src/features/onboarding/useOnboardingForm.ts` — stan ankiety (bieżący krok, odpowiedzi, walidacja, `finish`).
  - `src/features/onboarding/components/` — kroki: `RoleStep`, `StageStep`, `EventDateStep`,
    `ChildBirthDateStep`, `ChildrenCountStep`, `SpecialSituationsStep`, `EmploymentStep`, `PayerStep`,
    `PartnerStep`, `NamesStep`; rama: `OnboardingTopBar`, `OnboardingFooter`, `OnboardingStepContent`.
  - `src/data/onboarding/` — opcje kroków (`roleOptions`, `childrenCountOptions`, `payerSizeOptions`,
    `partnerOptions`, `stageOptions`, `employmentOptions`, `specialSituationOptions`, `eventDateQuestions`).
  - `src/components/molecules/TextField/` — pole tekstowe (nowe w Fazie 2, do imion).
  - `src/screens/OnboardingScreen.tsx` — składa ankietę w ekran.
- **Na później:** szczegóły wcześniaka (tydzień ciąży, masa, dni w szpitalu) z prototypu — dojdą
  przy Kalkulatorze (Faza 4), bo tylko on ich używa.

## Wiedza (Poradnik ZUS)

- **Branch/commit:** Faza 3, branch `feat/knowledge-base`: `2f7fb25` (model i treść), `27aab97`
  (wyszukiwarka), `707864d` (bloki treści, RichText), `d1b785e` (BackButton, LinkRow, SearchField),
  `b6be6ec` (ekrany i trasy).
- **Czym jest:** Zakładka z treścią „Poradnika dla rodziców i opiekunów dzieci” (ZUS, stan prawny
  1.04.2026): 7 rozdziałów, 30 artykułów. Wyszukiwarka (od 2 znaków) bez ogonków i z prostą obsługą
  odmiany („zasiłek” znajdzie „zasiłku”, „Z-3” to jedno słowo). Artykuł: treść w blokach, przycisk
  „Policz w kalkulatorze”, linki do zus.pl, źródło (strona Poradnika), „Dalej” w rozdziale.
- **Pliki:**
  - `src/domain/knowledge/Article.ts`, `Chapter.ts` — typy; artykuł = lista bloków (akapit, lista,
    słowniczek, ramka WAŻNE, ramka Przykład, tabela), pogrubienia jako `**tak**`.
  - `src/domain/knowledge/searchArticles.ts`, `articleTexts.ts`, `chapterArticles.ts`, `nextArticleInChapter.ts`.
  - `src/utils/normalizeSearchText.ts`, `stemSearchWord.ts`, `splitBoldSegments.ts`, `pluralizePl.ts`.
  - `src/data/knowledge/articles/` — treść, plik na rozdział (wygenerowana automatycznie z HTML
    prototypu `js/wiedza.js`); `chapters.ts` (ikona, ton), `zusLinks.ts`.
  - `src/features/knowledge/components/` — bloki (`ArticleBlockView` + `ParagraphBlock`, `ListBlock`,
    `GlossaryBlock`, `CalloutBlock`, `TableBlock`), listy `ArticleList`, `ChapterList`;
    `knowledgeRoutes.ts` — adresy ekranów.
  - `src/components/atoms/RichText`, `molecules/BackButton`, `LinkRow`, `SearchField`; `ScreenLayout`
    dostał opcjonalne `onBack`.
  - `src/screens/KnowledgeScreen/`, `ChapterScreen/`, `ArticleScreen/`; trasy
    `src/app/(tabs)/wiedza/_layout.tsx` (Stack), `index.tsx`, `[chapterId].tsx`, `artykul/[articleId].tsx`.
- **Na później:** infografiki z prototypu (`FIG`, liczone z parametrów prawnych — Faza 4), przyciski
  „Wniosek” (Faza 7), „Kontakt z ZUS”/„Wsparcie” (Faza 5), „Zapytaj asystenta” przy braku wyników
  (Faza 6), karty „na ten tydzień/miesiąc” na Starcie (`CARDS_POR`).

## Kalkulator zasiłku

- **Branch/commit:** Faza 4, branch `feat/calculator`: silnik `7c50e4c` (parametry prawne, wymiary
  urlopów), `63421c4` (zbieg tytułów, Z-3, świadczenie zastępcze), `7787c62` (L4 w ciąży), `90405f1`
  (symulacja dla obojga rodziców); UI `404d84f` (klocki formularza, suwak), `d995dfa` (stan formularza
  z ankiety), `bb0f11d` (ekran).
- **Czym jest:** Port zintegrowanego kalkulatora z prototypu (`js/calc.js` + `vSim`/`simOut`), pełny
  formularz jak w prototypie. Trzy sytuacje: **L4 w ciąży** (wynagrodzenie od pracodawcy 33/14 dni,
  zasiłek do 270 dni, świadczenie rehabilitacyjne, okres wyczekiwania), **poród** i **adopcja / rodzina
  zastępcza** (macierzyński, rodzicielski, ojcowski, 81,5% vs 100% + 70%, przejęcie macierzyńskiego
  przez tatę, 9 tyg. nieprzenoszalnych, wcześniak, „Za życiem”, praca na urlopie, limit wieku przy
  adopcji). Zbieg tytułów (etat / zlecenie / firma / KRUS), podstawa z Z-3, minimum 1000 zł na rękę,
  świadczenie z gminy/KRUS, gdy brak ubezpieczenia. Formularz wypełniany z ankiety; „Policz” w artykule
  otwiera właściwą sytuację (`/kalkulator?sytuacja=ciaza|porod|adopcja`).
- **Pliki:**
  - `src/data/legalParams.ts` — parametry prawne 2026 (z `K` prototypu); każda funkcja silnika bierze
    je jako argument (Panel administracyjny w Fazie 5 będzie mógł je nadpisać).
  - `src/domain/calculator/` — `maternityLeaveWeeks`, `parentalLeaveWeeks`, `adoptionLeaveWeeks`,
    `supplementaryLeaveWeeks`, `resolvePerson` (+ `PersonTitles`), `resolveZ3Base`, `toNetAmount`,
    `allowanceInstead`, `pregnancySickPay`, `concurrentTitlesSickPay`, `simulateBenefit` (+
    `BenefitSimulation`, `priceSegments`), `CalcCheck`, `CalculatorSituation`.
  - `src/features/calculator/` — `CalculatorForm` (typ), `personForm` (czyste zmiany osoby),
    `createCalculatorForm` (wartości z ankiety), `resolvePersonForm`, `computeCalculation`,
    `useCalculatorForm`, `situationParam`; `components/` — formularz i wyniki (oś czasu urlopów,
    lista odcinków, wyjaśnienia).
  - `src/components/molecules/SegmentedControl`, `ToggleChip`, `NumberField`, `Accordion`,
    `SliderField` (`@react-native-community/slider`); `atoms/Card`, `TextButton`.
  - `src/utils/formatMoney.ts`, `formatPercent.ts`, `parseDecimal.ts`.
  - `src/screens/CalculatorScreen/`; trasa `src/app/(tabs)/kalkulator.tsx`.
- **Uwaga:** `maternityLeaveWeeks` przeniesione z `domain/benefits` (oś czasu na Starcie korzysta
  teraz z parametrów prawnych). Szczegóły wcześniaka nie są jeszcze zbierane w ankiecie — kalkulator
  startuje z wartościami prototypu (32. tydzień, 1800 g, 21 dni) do poprawienia w „Więcej opcji”.

## Oś czasu (ekran Start)

- **Branch/commit:** `afde31e feat(timeline): oś czasu urzędowych kroków na ekranie Start` (main)
- **Czym jest:** Główny ekran po zalogowaniu/ankiecie. Pokazuje chronologiczną listę kroków
  urzędowych (zgłoszenie urodzenia, wniosek o zasiłek, 800+…) wyliczonych z profilu rodzica,
  z terminami, statusem (zrobione / pilne / spóźnione / przyszłe) i odhaczaniem zadań.
  Od Fazy 1: gość bez profilu widzi zamiast tego CTA „Sprawdź bez logowania” (patrz sekcja
  logowania wyżej) — skróty do Kalkulatora/Wiedzy/Asystenta to pomysł na później, gdy te
  zakładki będą mieć realną treść (Fazy 3–4).
- **Pliki:**
  - `src/domain/timeline/TimelineItem.ts` — typy: `Institution`, `TimelineEntry`, `TimelineStatus`, `TimelineItem`.
  - `src/domain/timeline/pregnancyEntries.ts`, `childEntries.ts`, `adoptionEntries.ts` — reguły: jakie wpisy dostaje rodzic w zależności od etapu.
  - `src/domain/timeline/buildTimeline.ts` — składa wszystkie wpisy w jedną listę.
  - `src/domain/timeline/resolveTimelineItem.ts` — dolicza `due`/`daysLeft`/`status` do wpisu.
  - `src/domain/timeline/formatDeadline.ts`, `formatDaysLeft.ts` — teksty terminów („ok. 12.03.2026”, „za 5 dni”).
  - `src/domain/timeline/TimelineContext.ts` — kontekst wyliczeń (dzisiejsza data, profil).
  - `src/features/timeline/useTimeline.ts` — hook łączący sesję z `buildTimeline`, stan odhaczonych zadań.
  - `src/features/timeline/resolveTimelineVisuals.ts` — zamienia status na wygląd (kolor, odznaka, przygaszenie).
  - `src/features/timeline/components/Timeline.tsx` — lista (pusta → komunikat, inaczej wiersze).
  - `src/features/timeline/components/TimelineRow.tsx`, `TimelineDot.tsx`, `TimelineCard.tsx` — wiersz = kropka (do odhaczania) + karta (odznaki, tytuł, opis, termin).
  - `src/data/institutions.ts` — etykiety i kolory instytucji (ZUS, NFZ, Pracodawca…).
  - `src/screens/StartScreen.tsx` — składa `Timeline` w ekran.

## Zestaw testów (jest + RNTL)

- **Branch/commit:** `35bd8ac test/jest-i-rntl (#2)` — scalony PR, dopisujący testy do wszystkiego, co
  powyżej (bez zmiany logiki). Zawiera też `eslint.config.js`.
- **Czym jest:** Testy jednostkowe/komponentowe dla domeny, komponentów, ekranów, nawigacji i sesji.
  `src/testing/` — fabryki danych testowych (`makeTimelineItem`, `renderWithProviders`, `sessionProbe`…).

## CI/CD (Forgejo Actions, Docker)

- **Branch/commit:** scalone do `main` (workflow-configuration) — poza zakresem rework.
- **Czym jest:** `.forgejo/workflows/` (ci, pr, release), `Dockerfile`, `nginx.conf` — budowanie i wdrażanie aplikacji.

## Świadczenia (katalog świadczeń) **[ODRZUCONE — branch usunięty 2026-11-21]**

Branch `feat/ekran-swiadczenia` budował zakładkę „Świadczenia” z katalogiem 18 świadczeń
(ZUS + gmina: 800+, Aktywny Rodzic, becikowe, kosiniakowe, wychowawczy) i regułami
kwalifikacji (`resolveEligibility`). **Odrzucony w całości** decyzją użytkownika — nowa
koncepcja nie ma osobnej zakładki Świadczenia (treść świadczeń chowa się pod artykuły w
Wiedzy) i zwęża zakres do świadczeń czysto zusowskich (bez gminnych/rodzinnych). Branch
usunięty lokalnie i na `origin`, nie scalony do `main`. Wzorce z niego (np. jedna funkcja
= jeden plik + test dla reguł domenowych) zostają inspiracją dla Fazy 4 (Kalkulator).

---

## Ekrany wciąż zaślepkowe

Na dziś bez logiki — sam nagłówek i opis (`ScreenLayout` bez treści):

- **Asystent** (`src/screens/AssistantScreen.tsx`) — Faza 6 rework: wyszukiwanie w bazie wiedzy.
- **Wiadomości** (`src/screens/MessagesScreen.tsx`) — usunięty z navbaru w Fazie 1 (`BenefitsScreen`
  usunięty całkowicie), Faza 5 wraca jako podekran Więcej.
- Test zaślepek: `src/screens/placeholderScreens.test.tsx` (sprawdza tylko nagłówek).

## Więcej (profil, wylogowanie) **[Faza 5 rozbuduje w hub]**

- **Branch/commit:** `6209bbc test(screens): MoreScreen — wylogowanie czyści sesję` (main);
  rozróżnienie Wyloguj/Usuń moje odpowiedzi w Fazie 1
  (`e910bc7 feat(screens): MoreScreen rozróżnia Wyloguj i Usuń moje odpowiedzi`,
  branch `feat/guest-mode`).
- **Czym jest:** Zakładka „Więcej”. Zalogowany widzi „Wyloguj” (czyści tylko `isSignedIn`,
  profil zostaje). Gość (niezalogowany) widzi „Usuń moje odpowiedzi i zacznij od nowa”
  (`resetProfile` — czyści profil i postęp zadań; to jego odpowiednik pełnego resetu, bo nie
  ma się z czego wylogować). Faza 5 rozbuduje to w menu: Moje dane z ZUS, Wiadomości, Dzieci,
  Kontakt, Ustawienia, O aplikacji, Wsparcie, Panel demo, Panel administracyjny.
- **Pliki:** `src/screens/MoreScreen.tsx` (+ `.test.tsx`).
