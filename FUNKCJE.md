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
| 1 | `feat/guest-mode` | Nowe taby, tryb gościa (profil bez logowania), RootNavigator bez wymuszonych strażników | 🔄 w toku |
| 2 | `feat/guest-survey` | Ankieta gościa — 9 kroków (rola, etap, data, liczba dzieci, sytuacje specjalne, zatrudnienie, płatnik, partner, imiona) | ⏳ |
| 3 | `feat/knowledge-base` | Zakładka Wiedza — 7 rozdziałów, ~20 artykułów Poradnika ZUS, wyszukiwarka | ⏳ |
| 4 | `feat/calculator` | Zintegrowany kalkulator zasiłku (zbieg tytułów, Z-3, adopcja, „za życiem”, wcześniak, praca na urlopie) | ⏳ |
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

## Dolna nawigacja (NavBar) **[ZASTĄPIONE w Fazie 1]**

- **Branch/commit:** `8ac33fb feat(nav): dolny pasek nawigacji z 5 zakładkami mZUS` (main)
- **Czym było:** Pasek zakładek: Start, Świadczenia, Asystent, Wiadomości, Więcej.
  Rework (Faza 1) zmienia zakładki na: Start, Wiedza, Asystent, Kalkulator, Więcej.
- **Pliki (struktura zostaje, treść `TABS` się zmienia):**
  - `src/navigation/tabs.ts` — `TABS`, jedyne źródło prawdy o zakładkach (nazwa, ikona, trasa, ton).
  - `src/components/organisms/NavBar/` — pasek: dzieci + rola `tablist` + margines bezpieczny.
  - `src/components/molecules/NavBarItem/` — jedna zakładka (ikona + etykieta), kolory liczy `resolveNavBarItemColors.ts`.
  - `src/app/(tabs)/_layout.tsx` — łączy routing (`expo-router/ui`) z wyglądem (`NavBar` + `NavBarItem`).

## Kalendarz i strażnik terminów

- **Branch/commit:** `5b18934 feat(domain): kalendarz, dni wolne i strażnik terminów urzędowych` (main)
- **Czym jest:** Czysta logika dat: dni wolne (z Wigilią od 2025), liczenie dni roboczych,
  parsowanie polskich dat, wyliczanie terminu („po” vs „przed”).
- **Pliki:**
  - `src/domain/dates/` — `holidays.ts`, `workingDays.ts`, `calendarDate.ts`, `parsePolishDate.ts`, `formatDate.ts`, `age.ts`.
  - `src/domain/deadlines/` — `Deadline.ts` (typ), `deadlines.ts` (wyliczanie terminu wiążącego).

## Profil rodzica **[Faza 2 rozszerzy]**

- **Branch/commit:** `2fe1254 feat(profile): model profilu rodzica i reguły formularza` (main)
- **Czym jest:** Model danych o sytuacji rodzica (etap, forma zatrudnienia, ubezpieczenie)
  i reguły walidacji formularza onboardingu. Faza 2 rework doda: `role`, `payerSize`,
  `childrenCount`, `name`/`childName`, `'preterm'` w sytuacjach specjalnych.
- **Pliki:**
  - `src/domain/profile/ParentProfile.ts` — typ profilu.
  - `src/domain/profile/insuranceFlags.ts` — czy dana forma zatrudnienia daje ubezpieczenie chorobowe.
  - `src/domain/profile/describeStage.ts` — opis etapu („ciąża, 28. tydzień” itp.) po polsku.
  - `src/domain/profile/toggleEmployment.ts`, `validateEventDate.ts` — logika formularza.

## Logowanie (mObywatel) i trasy chronione **[ZASTĄPIONE w Fazie 1 — logowanie staje się opcjonalne]**

- **Branch/commit:** `7f06e6a feat(session): symulowane logowanie przez mObywatel i chronione trasy` (main)
- **Czym było:** Zaślepka logowania przez mObywatel + stan sesji (zalogowanie, profil) +
  `RootNavigator`, który wymuszał kolejność logowanie → onboarding → zakładki.
  Rework (Faza 1): zakładki dostępne bez logowania; `profile` przestaje zależeć od
  `isSignedIn` (gość może mieć profil z ankiety); logowanie potrzebne tylko do danych
  z eZUS, Wiadomości i wyboru persony.
- **Pliki:**
  - `src/features/login/useSimulatedLogin.ts` — hook symulujący logowanie.
  - `src/screens/LoginScreen/` — ekran logowania.
  - `src/session/SessionContext.ts`, `SessionProvider.tsx`, `useSession.ts` — kontekst sesji.
  - `src/navigation/RootNavigator.tsx` — strażnicy trás (do przebudowy w Fazie 1).

## Onboarding (kreator sytuacji rodzica) **[Faza 2 rozszerzy do ankiety gościa]**

- **Branch/commit:** `48b5731 feat(onboarding): 4-etapowy kreator sytuacji rodzica` (main)
- **Czym jest:** 4-etapowy kreator: etap (ciąża/dziecko/adopcja), forma zatrudnienia,
  data zdarzenia, sytuacje specjalne. Faza 2 rozszerzy do 9 kroków z nowej koncepcji
  (dodaje rolę, liczbę dzieci, wielkość płatnika, drugiego rodzica, imiona) i uczyni
  dostępnym bez logowania („Sprawdź bez logowania”).
- **Pliki:**
  - `src/features/onboarding/useOnboardingForm.ts` — stan kreatora (krok, dane, walidacja kroku).
  - `src/features/onboarding/components/StageStep.tsx`, `EmploymentStep.tsx`, `EventDateStep.tsx`, `SpecialSituationsStep.tsx` — cztery kroki (plus nowe w Fazie 2: `RoleStep`, `PayerStep`, `PartnerStep`, `NamesStep`).
  - `src/features/onboarding/components/OnboardingTopBar.tsx`, `OnboardingFooter.tsx`, `OnboardingStepContent.tsx` — wspólna rama kreatora.
  - `src/screens/OnboardingScreen.tsx` — składa kreator w ekran.

## Oś czasu (ekran Start)

- **Branch/commit:** `afde31e feat(timeline): oś czasu urzędowych kroków na ekranie Start` (main)
- **Czym jest:** Główny ekran po zalogowaniu/ankiecie. Pokazuje chronologiczną listę kroków
  urzędowych (zgłoszenie urodzenia, wniosek o zasiłek, 800+…) wyliczonych z profilu rodzica,
  z terminami, statusem (zrobione / pilne / spóźnione / przyszłe) i odhaczaniem zadań.
  Faza 1 doda gościowi bez profilu skróty do Kalkulatora/Wiedzy/Asystenta/Kontaktu.
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
- **Wiadomości** (`src/screens/MessagesScreen.tsx`) — Faza 1 usuwa z navbaru, Faza 5 wraca jako podekran Więcej.
- Test obu: `src/screens/placeholderScreens.test.tsx` (sprawdza tylko nagłówek).

## Więcej (profil, wylogowanie) **[Faza 5 rozbuduje w hub]**

- **Branch/commit:** `6209bbc test(screens): MoreScreen — wylogowanie czyści sesję`
- **Czym jest:** Zakładka „Więcej” — przycisk wylogowania, który czyści sesję i wraca do ekranu logowania.
  Faza 5 rozbuduje to w menu: Moje dane z ZUS, Wiadomości, Dzieci, Kontakt, Ustawienia, O aplikacji,
  Wsparcie, Panel demo, Panel administracyjny.
- **Pliki:** `src/screens/MoreScreen.tsx` (+ `.test.tsx`).
