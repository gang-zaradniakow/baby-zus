# Słownik pojęć (PL ↔ kod)

Kod piszemy po angielsku. Ta tabela ustala, jak nazywamy polskie pojęcia prawne, żeby te same rzeczy miały w całym projekcie te same nazwy. Nową nazwę dopisujemy tu w tym samym PR, w którym pojawia się w kodzie.

## Osoby i instytucje

| Pojęcie (PL) | W kodzie | Uwagi |
|---|---|---|
| płatnik składek | `ContributionPayer` | pracodawca, zleceniodawca albo sama firma |
| ubezpieczony | `InsuredPerson` | |
| świadczeniobiorca | `Beneficiary` | osoba pobierająca świadczenie |
| rodzic / opiekun | `Parent` (`role`: `MOTHER`, `FATHER`, `GUARDIAN`) | |
| drugi rodzic | `OtherParent` | |
| dziecko / ciąża / przyjęte dziecko | `Child` (`kind`: `PREGNANCY`, `BORN`, `ADOPTED`) | |
| pracodawca (kadry) | `Employer` | adresat pism o urlopy |

## Ubezpieczenie

| Pojęcie (PL) | W kodzie | Uwagi |
|---|---|---|
| tytuł ubezpieczenia | `InsuranceTitle` | etat, zlecenie, firma, KRUS |
| zbieg tytułów | `InsuranceTitleResolver` | |
| umowa o pracę (etat) | `EMPLOYMENT` | |
| umowa zlecenia | `MANDATE_CONTRACT` | |
| działalność gospodarcza (JDG) | `SELF_EMPLOYMENT` | |
| ubezpieczenie chorobowe obowiązkowe / dobrowolne | `MANDATORY` / `VOLUNTARY` sickness insurance | |
| ulga na start | `StartupRelief` | 6 miesięcy bez ubezpieczeń społecznych |
| zaległość w składkach | `ContributionDebt` | powyżej 1% płacy minimalnej blokuje zasiłek |
| podstawa wymiaru zasiłku | `BenefitBase` | |
| okres wyczekiwania | `WaitingPeriod` | 30 / 90 dni |
| okres zasiłkowy | `BenefitPeriod` | w ciąży 270 dni |

## Świadczenia i urlopy

| Pojęcie (PL) | W kodzie |
|---|---|
| zasiłek macierzyński | `MaternityBenefit` |
| zasiłek chorobowy | `SicknessBenefit` |
| wynagrodzenie chorobowe | `SickPay` |
| świadczenie rehabilitacyjne | `RehabilitationBenefit` |
| zasiłek opiekuńczy | `CareBenefit` |
| zasiłek pogrzebowy | `FuneralGrant` |
| świadczenie rodzicielskie (z gminy) | `ParentalAllowance` |
| urlop macierzyński | `MaternityLeave` |
| urlop rodzicielski | `ParentalLeave` |
| urlop ojcowski | `PaternityLeave` |
| uzupełniający urlop macierzyński | `SupplementaryMaternityLeave` |
| urlop na warunkach urlopu macierzyńskiego | `AdoptionLeave` |
| wariant 81,5% (uśredniony) | `AveragedVariant` |
| wariant 100% + 70% | `StandardVariant` |
| łączenie urlopu z pracą | `PartTimeWork` |
| przysposobienie / rodzina zastępcza | `Adoption` / `FosterFamily` |
| „Za życiem” | `ZaZyciemCertificate` (nazwa własna) |

## Terminy i aplikacja

| Pojęcie (PL) | W kodzie | Uwagi |
|---|---|---|
| termin „w ciągu X dni od” | `DeadlineType.AFTER` | przesuwa się na dzień roboczy |
| termin „co najmniej X dni przed” | `DeadlineType.BEFORE` | nie przesuwa się do przodu |
| bezpieczna data złożenia | `safe` | |
| oś czasu | `Timeline` | |
| przewodnik | `Guide` | |
| ankieta | `Survey` | |
| tryb wsparcia / tryb ciszy | `Mode.SUPPORT` / `Mode.SILENCE` | |
| kreator wniosku | `WizardDefinition` | |
| szkic wniosku | `ApplicationDraft` | |
| „tłumacz pism” | `summary` + `todo` dokumentu | |
| łagodny komunikat | `gentleMessage` | tekst po polsku dla użytkownika |

Bez tłumaczenia (kody formularzy i systemów): e-ZLA, UPO, Z-3, Z-3a, ZAM, ZAS-53, Z-15A, Z-12, ZUS ZUA, ZUS ZCNA, eZUS, PUE, KRUS.
