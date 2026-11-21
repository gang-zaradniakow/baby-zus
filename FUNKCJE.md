# Funkcje mZUS dla Rodzica — co jest zrobione i gdzie

Mapa funkcji aplikacji względem gałęzi (branchy) i commitów. Dla każdej funkcji:
czym jest, jaki branch/commit ją wprowadził i jakie pliki za nią stoją.

**Ten plik aktualizuję przy każdej nowej zmianie** — nowa funkcja albo nowy branch
dostają własną sekcję, zanim commit zostanie opisany użytkownikowi jako gotowy.

---

## Rework (od 2026-11-21) — wszystkie fazy zrobione

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
| 5 | `feat/more-hub` | Więcej jako hub: Moje dane z ZUS, Wiadomości, Dzieci, Kontakt, Ustawienia, O aplikacji, Wsparcie, Panel demo, Panel administracyjny (mock), tryb wsparcia | ✅ |
| 6 | `feat/assistant` | Asystent — wyszukiwanie w bazie wiedzy (bez AI) | ✅ |
| 7 | `feat/wizards` | Kreatory wniosków/urlopów + „Sprawdź sprawę” (mock, bez PDF) | ✅ |

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

## Wnioski i pisma, „Sprawdź sprawę”

- **Branch/commit:** Faza 7, branch `feat/wizards`: `c327252` (silnik i 9 kreatorów), `1406a15` (ekrany,
  wynik, Moje dokumenty), `4530299` („Sprawdź sprawę”).
- **Czym jest:** Kreatory „jednego oddechu” z prototypu (`js/wizards.js`): jedno pytanie na ekran,
  łagodne komunikaty, terminy prawne sprawdzane na bieżąco (błąd blokuje, ostrzeżenie pozwala iść dalej),
  „Sprawdź i zatwierdź”, a na końcu **pismo do pracodawcy** (podgląd + „Udostępnij / wyślij do kadr”)
  albo **wniosek do ZUS / gov.pl** (symulacja z numerem UPO, wymaga logowania). Kreatory: 81,5% (21 dni
  od porodu), urlop rodzicielski (21 dni przed, maks. 5 części), ojcowski (7 dni przed, do 1. urodzin),
  uzupełniający (wcześniak), opiekuńczy Z-15A, adopcja (7/21 dni), przejęcie macierzyńskiego przez tatę,
  odpis aktu urodzenia, pogrzebowy Z-12. Wyniki trafiają do Wiadomości → „Moje dokumenty” (także gościa).
  **Sprawdź sprawę** (w zakładce Kalkulator): dane z dokumentów wpisane ręcznie → ubezpieczenie w dniu
  zdarzenia, okres wyczekiwania, zaległość, kto wypłaca; „Przelicz w kalkulatorze”.
- **Pliki:**
  - `src/domain/wizards/` — `Wizard` (typy), `createWizardContext`, `wizardAnswers`, `checkStep`,
    `prefillAnswers`, `describeAnswer`, `letterToText`, `createUpoNumber`, `SentDocument`.
  - `src/data/wizards/` — 9 kreatorów (plik na kreator) + `index.ts` (`WIZARDS`, `findWizard`), `formsGlossary.ts`.
  - `src/features/wizards/` — `useWizardForm`, `components/WizardStepInput`, `LetterPreview`, `InstitutionBadge`.
  - `src/domain/caseCheck/verifyCase.ts`.
  - `src/screens/WizardListScreen/`, `WizardScreen/`, `WizardResultScreen/`, `CaseCheckScreen/`; trasy
    `src/app/(tabs)/wiecej/wnioski.tsx`, `wniosek/[wizardId].tsx`, `dokument/[documentId].tsx`,
    `src/app/(tabs)/kalkulator/` (Stack: `index`, `sprawa`).
  - `components/molecules/RadioRow`, `CheckList` (przeniesiony z kalkulatora); `utils/formatTime`;
    sesja: `sentDocuments`; `legalParams.funeralAllowance`.
- **Powiązania:** „Przygotuj wniosek” w artykułach Wiedzy, przyciski wniosków w Asystencie, Z-12 w trybie
  wsparcia, hub „Sprawy”.
- **Świadomie pominięte:** szkice zapisywane między wejściami, wybór plików i odczyt PDF (deklaracja
  „dołączę” zamiast pliku), druk/PDF (udostępnianie tekstu zamiast), checklista dowodowa JDG.

## Asystent (baza wiedzy, bez AI)

- **Branch/commit:** Faza 6, branch `feat/assistant`: `140caa0` (baza wiedzy i silnik), `72b8534` (ekran).
- **Czym jest:** Rozmowa z lokalną bazą wiedzy (51 pytań i odpowiedzi z prototypu, `js/kb.js`) —
  działa offline, każda odpowiedź ma źródło. Silnik to port punktacji `search`/`answerLocal` z
  `js/chat.js`; **zgodność potwierdzona testem** na wynikach oryginału dla 63 pytań. Słabe
  dopasowanie → uczciwe „nie mam pewnej odpowiedzi” + kontakt z ZUS. „Dla Ciebie:” — dopowiedzenia
  z profilu (kto wypłaca zasiłek, wniosek ZAM przy firmie, zaległość z eZUS, terminy). Podpowiedzi
  pytań wg etapu z ankiety albo trybu wsparcia, podobne pytania, ocena odpowiedzi. Tryb AI z
  prototypu (serwer → Claude) świadomie pominięty — w aplikacji nie ma AI.
- **Pliki:**
  - `src/data/assistant/knowledgeBase.ts` (wygenerowane z HTML prototypu; linki do kreatorów wniosków
    pominięte — Faza 7), `suggestions.ts`.
  - `src/domain/assistant/` — `KnowledgeEntry`, `questionTokens`, `searchKnowledgeBase`, `answerQuestion`
    (+ `__fixtures__/prototypeAnswers.json`), `personalizeAnswer`.
  - `src/features/assistant/` — `useAssistantChat`, `assistantHref`, `components/AssistantReply`,
    `ChatComposer`.
  - `src/screens/AssistantScreen/`; `StepLayout` dostał `autoScrollToEnd`.
- **Wejścia:** `/asystent?pytanie=…` — „Zapytaj asystenta” w Wiedzy (brak wyników), w piśmie z ZUS
  i w trybie wsparcia.

## Więcej (hub) i ekrany po zalogowaniu

- **Branch/commit:** Faza 5, branch `feat/more-hub`: `6ac1060` (hub, Kontakt, Wsparcie, O aplikacji),
  `08c5bf9` (Ustawienia), `d45b81e` (konto eZUS, pisma, przykładowe osoby), `49e8362` (Moje dane z ZUS,
  Wiadomości, Panel demo), `78f6631` (Panel administracyjny), `9cb915c` (tryb wsparcia, sytuacja, profil dziecka).
- **Czym jest:** Zakładka „Więcej” jako hub (port `vMore`) ze stosem podekranów:
  - **Konto:** gość — „Zaloguj przez mObywatel”, „Wypełnij ankietę / Zmień odpowiedzi” (ankieta od zera),
    „Usuń moje odpowiedzi”; zalogowany — karta konta, „Moje sprawy w ZUS”, „Wyloguj”.
  - **Moje dane z ZUS** (po zalogowaniu): chorobowe tak/nie, tytuły ubezpieczenia, e-ZLA, zaległość
    wobec progu 1%; „Przelicz zasiłek na tych danych” — kalkulator po zalogowaniu bierze podstawę i
    zaległość z eZUS.
  - **Wiadomości** (po zalogowaniu): Korespondencja (licznik nieprzeczytanych) i Archiwum; pismo z
    „tłumaczem pism” (co to oznacza, co zrobić), otwarcie = przeczytane, do archiwum / przywróć.
  - **Profil dziecka** i **„Moja sytuacja się zmieniła”** → **tryb wsparcia po stracie**: Start bez osi
    czasu i odliczania, tylko świadczenia po stracie, kontakt z człowiekiem, organizacje; po potwierdzeniu,
    zawsze odwracalny.
  - **Kontakt** (e-wizyta i mama@zus.pl — zaślepki, infolinia), **Wsparcie** (organizacje, telefony,
    strony), **Ustawienia** (motyw jasny/ciemny/systemowy, rozmiar tekstu A/A+/A++ — w całej aplikacji),
    **O aplikacji** (bez AI w aplikacji — uczciwie).
  - **Panel demo:** 6 przykładowych osób z prototypu (podmiana profilu + logowanie), własna ankieta, reset.
  - **Panel administracyjny** (hasło demo `zus2026`): parametry prawne bez zmiany kodu — od razu w
    kalkulatorach, rejestr zmian (w pamięci, bez REST).
- **Pliki:**
  - `src/screens/MoreScreen/` (hub), `ContactScreen/`, `SupportScreen/`, `AboutScreen/`, `SettingsScreen/`,
    `ZusDataScreen/`, `MessagesScreen/`, `DocumentScreen/`, `DemoScreen/`, `AdminScreen/`, `SituationScreen/`,
    `LossScreen/`, `ChildrenScreen/`; trasy `src/app/(tabs)/wiecej/` (Stack), adresy w `features/more/moreRoutes.ts`.
  - `src/domain/zus/` — `ZusAccount`, `buildZusAccount` (port `zusData`), `ZusDocument`, `buildZusDocuments`.
  - `src/data/demo/personas.ts`, `data/supportOrganizations.ts`, `data/zusContact.ts`, `data/support/supportItems.ts`.
  - `src/features/zus/` (`useZusData`, wiersze tytułów i e-ZLA), `features/more/components/` (`MoreSection`,
    `LoginRequired`), `features/support/components/SupportHome`, `features/admin/` (pola i opis zmian),
    `features/calculator/applyZusAccount.ts`.
  - `src/params/` — `LegalParamsProvider` / `useLegalParams` (parametry prawne z Panelu administracyjnego).
  - Sesja: `personaId`/`applyPersona`, przeczytane i przeniesione pisma, `supportMode`.
  - Motyw: `mode` (system/light/dark) i `textScale`; `AppText` skaluje typografię (`theme/scaleTextStyle`).
- **Świadomie pominięte:** tryb spokojny i powiadomienia w Ustawieniach (nie ma jeszcze czego wyciszać),
  kilka profili dzieci naraz (profil ma jedno dziecko — u Zofii z prototypu bez drugiej ciąży), szkice
  i UPO w Wiadomościach (Faza 7), checklista dowodowa JDG, symulacje rejestru PESEL i offline z Panelu demo.

