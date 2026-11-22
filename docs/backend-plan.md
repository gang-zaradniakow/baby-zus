# Backend „mZUS dla Rodzica” — plan (wersja 3)

> Podstawa: makieta `mZUS-dla-Rodzica (1)` (`OPIS_PROJEKTU.md`, `js/calc.js`, `js/app.js`, `js/wizards.js`, `js/wiedza.js`).
> Założenia: jedna osoba + agent LLM, **API first** (`openapi.yaml` → openapi-generator), DDD i CQRS (PipelinR), mapowanie MapStruct, Lombok w miarę potrzeby, `record` gdzie się da, PostgreSQL, testy jednostkowe i integracyjne, małe PR-y, logowanie przez mObywatel zmockowane, kod po angielsku.

## 1. Zakres

| Funkcja makiety | Backend? | Uwagi |
|---|---|---|
| Parametry prawne + panel administracyjny (rejestr zmian) | **Tak, rdzeń** | Parametry są **częścią kodu** (klasa na stan prawny, wersja i data obowiązywania). Panel admina na razie **tylko podgląd** (PR 13) |
| Zintegrowany kalkulator: ciąża (L4), poród, adopcja, oboje rodzice, zbieg tytułów, Z-3, wcześniak, „Za życiem”, praca na urlopie | **Tak, rdzeń** | Port `calc.js` (`simulate`, `resolvePerson`, `chorobowyCiaza`, `adoptWeeks`, `uzupelniajacy`, `podstawaZ3`) |
| Strażnik terminów (święta, `after` / `before`) | **Tak, rdzeń** | |
| Ankieta → „Mój przewodnik” (oś czasu, alerty, plan, karta tygodnia) | **Tak** | Gość: zapytanie bezstanowe. Zalogowany: profil w bazie |
| Wiedza (rozdziały, artykuły, wyszukiwarka), słowniczek formularzy, organizacje, linki | **Tak, tylko odczyt** | Treści z JSON |
| Logowanie mObywatel → PIN → persona | **Tak, mock** | PIN zostaje na urządzeniu |
| Moje dane z ZUS: tytuły, e-ZLA, zadłużenie, zaświadczenie | **Tak, mock eZUS** | Warstwa antykorupcyjna |
| 9 kreatorów: pisma PDF do pracodawcy / wysyłka do ZUS (UPO) / odpis aktu (gov.pl) | **Tak** | Pisma działają też dla gościa (bez zapisu) |
| Wiadomości z „tłumaczem pism”, archiwum, moje dokumenty, szkice | **Tak** | |
| Tryb wsparcia, zdarzenia PESEL (panel demo) | **Tak** | |
| e-Wizyta, mama@zus.pl | Opcjonalnie (P3) | Zaślepki |
| „Sprawdź sprawę” | **Nie** | Usunięte z zakresu |
| Asystent (LLM i baza wiedzy) | **Nie** | Oddzielny serwis. Tryb bazy wiedzy działa w przeglądarce (`chat.js`). Backend udostępnia mu tylko dane: `GET /legal-parameters` i `/knowledge/*` |
| Motyw, rozmiar tekstu, symulacja offline, checklista JDG ze zdjęciami | **Nie** | Zostaje we frontendzie (`localStorage`) |

## 2. Architektura

### 2.1 Zasady
- **Modularny monolit.** Jeden moduł to jeden bounded context (pakiet najwyższego poziomu). Granice pilnuje Spring Modulith (sekcja 2.6).
- **Warstwy w każdym module** (heksagonalnie):
  - `domain`: agregaty, value objects, polityki, zdarzenia domenowe, porty repozytoriów. **Czysta Java**, bez Springa i JPA (uzasadnienie w 2.6).
  - `application`: komendy i zapytania PipelinR wraz z handlerami (beany Springa), transakcje, porty do systemów zewnętrznych.
  - `infrastructure`: encje JPA, repozytoria, mapery MapStruct, adaptery (mObywatel, eZUS, PDF), kontrolery REST implementujące interfejsy wygenerowane z `openapi.yaml`.
- **API first** (sekcja 2.9): każdy endpoint zaczyna się od wpisu w `openapi.yaml`. Interfejsy kontrolerów i DTO generuje `openapi-generator-maven-plugin`.
- **`record` wszędzie, gdzie się da**: komendy, zapytania, wyniki, value objects, zdarzenia domenowe, publiczne DTO modułów. Klasami zostają agregaty (mają stan i zachowanie), encje JPA i DTO wygenerowane z OpenAPI.
- **Lombok w miarę potrzeby** (sekcja 2.10).
- **CQRS na PipelinR** (sekcja 2.4): komendy i zapytania implementują wprost `an.awesome.pipelinr.Command<R>`. Jedna baza PostgreSQL:
  - Komendy przechodzą przez agregat i repozytorium. Zwracają `Voidy` albo identyfikator.
  - Zapytania czytają przez **interfejs repozytorium** (port z `domain`) i zwracają rekordy `*Dto`; SQL i JPA zostają w adapterach `infrastructure`.
  - Obliczenia (kalkulatory, terminy, przewodnik gościa) to zapytania bezstanowe, które wołają usługi domenowe.
- **Zdarzenia między modułami** publikuje Spring Modulith (`@ApplicationModuleListener`, rejestr publikacji). Zdarzenia wewnątrz jednego modułu mogą iść przez `Notification` z PipelinR.
- **Mapowanie MapStruct** (sekcja 2.5).
- **Czas** zawsze z interfejsu `DateTimeGenerator` (`shared.time`: `now()`, `today()`, `zone()`), nigdy z `LocalDate.now()`. Produkcyjnie działa `ClockDateTimeGenerator` na `Clock` w strefie Europe/Warsaw. Persony mają daty względne, a testy używają `FixedDateTimeGenerator` (zatrzymany czas, `advanceDays`, `setDay`). Reguła ArchUnit zabrania `now()` z `java.time` poza `shared.time`.
- **Pieniądze** jako VO `Money` (`BigDecimal`). Stopy jako `Rate`, tygodnie jako `Weeks`.
- **Kod po angielsku**, słownik pojęć PL↔EN w sekcji 9 (docelowo `docs/glossary.md`).

### 2.2 Mapa kontekstów

```
                 ┌──────────────┐
                 │  identity    │  mock mObywatel, JWT
                 └──────┬───────┘
                        │ UserRegistered
┌──────────────┐  ┌─────▼────────┐   ┌──────────────────┐
│ legalrules   │◄─┤ benefits     │   │ insuredaccount   │  ACL nad mock eZUS
│ (parametry,  │  │ (kalkulacje) │   │ (tytuły, e-ZLA,  │
│  wersje)     │  └─────▲────────┘   │  zadłużenie)     │
└──────▲───────┘        │            └───────▲──────────┘
       │                │                    │ prefill
┌──────┴───────┐  ┌─────┴─────────────────────┴──┐
│ calendar     │◄─┤ guide                         │  profil rodzica, dzieci,
│ (święta,     │  │ (przewodnik, oś czasu,        │  tryb wsparcia
│  terminy)    │  │  alerty)                      │
└──────────────┘  └─────▲─────────────┬───────────┘
                        │ ApplicationSubmitted
                  ┌─────┴────────┐    │ ChildRegistered / ChildDied
                  │ applications │────┘
                  │ (kreatory,   │──────────────┐ ApplicationSubmitted
                  │  pisma, UPO) │              ▼
                  └──────────────┘       ┌──────────────┐
┌──────────────┐                         │correspondence│ pisma, UPO, archiwum
│ knowledge    │  treści (odczyt)        └──────────────┘
└──────────────┘
```

Moduł udostępnia innym tylko **publiczne API** (pakiet główny modułu: interfejsy i rekordy DTO) albo zdarzenia. Nikt nie sięga do cudzego `domain` ani `infrastructure`.

### 2.3 Konteksty i model domenowy

**`legalrules` — parametry prawne**
- **Parametry są w kodzie, nie w bazie:** każdy stan prawny to klasa (np. `LegalState2026`) z wersją, datą obowiązywania i wszystkimi wartościami. Nowe przepisy to nowa klasa z kolejną wersją.
- Agregat `ParameterSet`: `version`, `validFrom`, `description` (stan prawny), `LegalParameters`. Port `ParameterSetRepository.findEffectiveOn(day)` zwraca najnowszą wersję, która w danym dniu już obowiązuje. Adapter `InCodeParameterSetRepository` (infrastructure) trzyma wersje z kodu.
- Logika (kompletność, walidacja wartości, wybór wymiaru wg liczby dzieci i „Za życiem”) jest w domenie: `LegalParameters`, `ParameterValue`.
- Publikowane innym modułom: zapytania `application.query` (`GetCurrentLegalParametersQuery`, `GetLegalParametersEffectiveOnQuery`), ich wyniki `application.dto` (`LegalParametersDto`, `ParameterDto`: proste rekordy bez logiki) oraz pakiet `api` z typami bez logiki: `api.model` (`ParameterKey`, `ParameterKind`) i `api.exception`. Każdy z tych pakietów ma `@NamedInterface`.
- Inne moduły pobierają parametry zapytaniem przez `Pipeline`, np. `GetLegalParametersEffectiveOnQuery(dzień porodu)`, i budują z DTO własny model do obliczeń.
- Panel admina (PR 13): na razie tylko podgląd parametrów, bez edycji.

**`calendar` — terminy**
- Domena: `PolishHolidays` (Wielkanoc metodą Meeusa, Wigilia od 2025), `WorkingDays` (`isDayOff`, `dayOffReason`, `onOrAfter`, `onOrBefore`), `DeadlinePolicy` (`daysAfter`, `monthsAfter`, `daysBefore`) → VO `Deadline(type, raw, legal, shifted, reason, safe)`. Bez persystencji; beany domeny rejestruje `infrastructure.config`.
- Publikowane: `application.query.CalculateDeadlineQuery` (dokładnie jedno z `days`/`months`, `BEFORE` tylko w dniach), `application.dto.DeadlineDto`, `api.model.DeadlineType`.

**`benefits` — kalkulacje (sama domena, bez zapisu)**
- Parametry: `BenefitParameters` (własny model modułu), budowany z `LegalParametersDto` zapytaniem `GetCurrentLegalParametersQuery` przez `Pipeline`.
- `insurance`: VO `InsuranceTitles` (etat, zlecenie, firma, KRUS z atrybutami). Polityka `InsuranceTitleResolver` (zbieg tytułów) → `ResolvedInsurance(mainTitle, base, parts, checks, agriculturalInsurance, blockingDebt)`. Komunikaty identyczne z makietą (`PolishFormat` odtwarza formatowanie kwot `pl-PL`).
- `base`: `BenefitBaseCalculator.fromZ3(months, title, fullTime)`.
- `sickness`: `PregnancySicknessCalculator`: wynagrodzenie chorobowe 33/14 dni, zasiłek 100%, okres 270 dni, świadczenie rehabilitacyjne, okres wyczekiwania 30/90 dni, wiele tytułów.
- `leave`: `LeaveDimensionsPolicy`, `AdoptionLeavePolicy` (7/10/14 lat, min. 9/38/62 tyg.), `SupplementaryLeavePolicy` (15/8 tyg.), parametry `LeaveParameters`; endpoint `POST /calculations/leave-dimensions`.
- `maternity`: `MaternityBenefitSimulator`:
  - podział urlopu między rodziców (14 tyg. tylko mama, 9 tyg. nieprzenoszalne, przejęcie przez tatę),
  - wariant 81,5% albo 100/70,
  - łączenie z pracą (¼ lub ½ etatu, wydłużenie urlopu, limity 82/86/130/134 tyg.),
  - segmenty na osi czasu,
  - kwoty netto z minimum 1000 zł.

  Do tego `AlternativeBenefitPolicy` (KRUS albo świadczenie rodzicielskie z gminy).
- Wyniki niosą listę `Check(level: OK|INFO|NO, message)`.

**`guide` — przewodnik**
- VO `Survey` (rola, etap, daty, liczba dzieci, wcześniak, „Za życiem”, formy pracy, wielkość płatnika, drugi rodzic).
- Agregat `ParentProfile` (`UserId`, rola, formy pracy, płatnik, tryb drugiego rodzica, `Mode` NORMAL/SUPPORT/SILENCE, aktywne dziecko): `enterSupportMode(kind)`, `exitSupportMode()`.
- Agregat `Child` (`kind` PREGNANCY/BORN/ADOPTED, daty, liczba, `Preterm`, `zaZyciem`, `lost`, `Set<TaskKey>`): `registerBirth`, `markLost`, `completeTask`, `reopenTask`.
- Polityki: `TimelinePolicy`, `AlertPolicy`, `BenefitPlanPolicy`, `WeekCardPolicy`.
- Zapytania: `PreviewGuide(survey)` dla gościa, `GetMyGuide`. Komendy: `CompleteSurvey`, `AddChild`, `SelectActiveChild`, `CompleteTask`, `EnterSupportMode`, `ExitSupportMode`, `RegisterBirth`, `RegisterChildDeath`.
- Nasłuchuje `ApplicationSubmitted` (oznacza zadanie na osi czasu) i `UserRegistered` (tworzy profil z persony).

**`applications` — wnioski**
- `WizardDefinition` (9 kreatorów: `w-81`, `w-rodzicielski`, `w-ojcowski`, `w-uzupelniajacy`, `w-opiekunczy`, `w-adopcja`, `w-przejecie`, `w-odpis`, `w-pogrzebowy`): kroki, prefill, walidacje „łagodne” (komunikat + blokada), `build()`, adresat.
- Agregaty `ApplicationDraft` (autozapis) i `Application` (złożony wniosek, UPO, PDF). Zdarzenie `ApplicationSubmitted`.
- Porty: `LetterRenderer` (Thymeleaf → PDF), `EzusSubmissionGateway` (mock UPO), `CivilRegistryGateway` (mock gov.pl).
- Gość: zapytanie `RenderLetter(wizardId, answers)` zwraca PDF bez zapisu.

**`correspondence` — korespondencja**
- Agregat `Document` (nadawca, tytuł, data, treść, `summary` i `todo` z „tłumacza pism”, `offline`, `archived`, `readAt`). Komendy `MarkRead`, `Archive`, `Restore`.
- Nasłuchuje `ApplicationSubmitted`, `DebtCertificateIssued`, `ChildRegistered`. Seed dokumentów dla persony.

**`insuredaccount` — dane z eZUS (warstwa antykorupcyjna)**
- Port `EzusGateway` + `MockEzusAdapter` (dane person kluczowane fikcyjnym PESEL-em): tytuły, e-ZLA, zadłużenie na dzień zdarzenia.
- Zapytania: `GetInsuranceOverview`, `GetSickLeaves`, `GetContributionBalance`, `GetCalculatorPrefill`. Komenda `RequestDebtCertificate` → `DebtCertificateIssued`.

**`identity` — mock mObywatel**
- Przepływ imitujący OIDC (authorization code):
  1. `GET /auth/mobywatel/authorize?redirect_uri&state` → 302 na `/mock/mobywatel/login`.
  2. Strona Thymeleaf z wyborem persony.
  3. Redirect na `redirect_uri?code&state`.
  4. `POST /auth/token` → JWT (HS256) + refresh token.
- Port `IdentityProvider` + `MockMObywatelAdapter`. Prawdziwy Węzeł Krajowy da się podpiąć później bez zmian w domenie.
- `UserAccount`. Zdarzenie `UserRegistered` przy pierwszym logowaniu.
- Rola `ADMIN` dla panelu parametrów: hasło z konfiguracji (demo `zus2026`) wymieniane na JWT z rolą.

**`knowledge` — treści (tylko odczyt)**
- Rozdziały i artykuły (`wiedza.js`), katalog świadczeń, formularze, ciekawostki, karty tygodnia, organizacje, telefony, linki. JSON w `resources/content/`, wyszukiwarka z normalizacją polskich znaków. Bez warstwy `domain`: to zwykły odczyt.

### 2.4 CQRS z PipelinR

PipelinR (`net.sizovs:pipelinr`, pakiet `an.awesome.pipelinr`) ma jeden typ `Command<R>` z `Command.Handler<C, R>` oraz `Notification`. **Komendy i zapytania implementują bezpośrednio `an.awesome.pipelinr.Command<R>`**, bez własnych interfejsów pośrednich. Rozróżnienie wynika z konwencji, a pilnują go testy ArchUnit:
- komenda leży w `application.command`, a zapytanie w `application.query` (pakiety publikowane innym modułom oznaczamy `@NamedInterface`),
- handlery leżą osobno, w `application.handler`; handler komendy ma `@Transactional`, a handler zapytania `@Transactional(readOnly = true)` (reguła sprawdza pakiet obsługiwanego typu),
- wyniki zapytań to proste rekordy `*Dto` w `application.dto`,
- komenda zwraca `Voidy` albo identyfikator, zapytanie zwraca rekord wyniku.

```java
// shared.cqrs — konfiguracja
@Bean
Pipeline pipeline(ObjectProvider<Command.Handler> handlers,
                  ObjectProvider<Command.Middleware> middlewares,
                  ObjectProvider<Notification.Handler> notificationHandlers) {
    return new Pipelinr()
        .with(handlers::orderedStream)
        .with(middlewares::orderedStream)
        .with(notificationHandlers::orderedStream);
}
```

Middleware (`Command.Middleware`, w tej kolejności):
1. `LoggingMiddleware`: nazwa komendy i czas wykonania, bez danych osobowych.
2. `ValidationMiddleware`: Jakarta Bean Validation na rekordzie komendy.

Transakcje są na handlerach (`@Transactional`), nie w middleware, bo PipelinR nie odróżnia komend od zapytań.

Przykład użycia:

```java
import an.awesome.pipelinr.Command;

public record ChangeParameters(@NotNull LocalDate validFrom, String description,
                               @NotEmpty Map<String, Object> values) implements Command<Integer> {}

public record GetCurrentParameters() implements Command<LegalParametersView> {}

@Component
@RequiredArgsConstructor
class ChangeParametersHandler implements Command.Handler<ChangeParameters, Integer> {
    private final ParameterSetRepository repository;   // port z domain
    private final DomainEventPublisher events;

    @Override
    @Transactional
    public Integer handle(ChangeParameters cmd) {
        var current = repository.current();
        var next = current.revise(cmd.validFrom(), cmd.description(), cmd.values());
        repository.save(next);
        events.publish(new ParametersChanged(next.version()));
        return next.version();
    }
}

// kontroler implementuje interfejs wygenerowany z openapi.yaml (sekcja 2.9)
@RestController
@RequiredArgsConstructor
class AdminParametersController implements AdminLegalParametersApi {
    private final Pipeline pipeline;
    private final LegalParametersWebMapper mapper;

    @Override
    public ResponseEntity<ParameterVersionDto> changeLegalParameters(ChangeLegalParametersRequestDto body) {
        var version = pipeline.send(mapper.toCommand(body));
        return ResponseEntity.ok(new ParameterVersionDto().version(version));
    }
}
```

Konwencja nazw: komendy w trybie rozkazującym (`ChangeParameters`, `SubmitApplication`), zapytania zawsze z sufiksem `Query` (`GetCurrentLegalParametersQuery`, `PreviewGuideQuery`, `CalculateMaternityBenefitQuery`; pilnuje tego ArchUnit), handler to nazwa zapytania bez sufiksu `Query` + `Handler` (`GetCurrentLegalParametersQuery` → `GetCurrentLegalParametersHandler`; pilnuje tego ArchUnit). Jedna komenda lub zapytanie to jeden handler w `application.handler`.

### 2.5 Mapowanie MapStruct

Gdzie mapujemy:
- **Web ↔ application:** wygenerowany DTO z OpenAPI → rekord komendy/zapytania, rekord wyniku → wygenerowany DTO odpowiedzi (`*WebMapper` w `infrastructure.web`). Dzięki temu wygenerowane klasy nie wyciekają poza warstwę web.
- **Domena ↔ persystencja:** agregat ↔ encja JPA (`*PersistenceMapper` w `infrastructure.persistence`).
- **Między modułami:** publiczne DTO modułu ↔ model lokalny, np. prefill z `insuredaccount` → `InsuranceTitles` z `benefits` (mapper w module konsumenta).

Zasady:
- `@MapperConfig` w shared kernelu: `componentModel = SPRING`, `unmappedTargetPolicy = ERROR`, `injectionStrategy = CONSTRUCTOR`. Brakujące pole psuje kompilację, a nie produkcję.
- Agregaty mają prywatny stan i fabrykę `reconstitute(...)`, a mapper jej używa (`@ObjectFactory`). Bez setterów w domenie.
- MapStruct mapuje rekordy przez kanoniczny konstruktor, więc komendy, wyniki i VO nie wymagają dodatkowej konfiguracji.
- VO (`Money`, `Rate`, `Weeks`, identyfikatory) przez wspólny `ValueObjectMappers` (`@Mapper(uses = …)`).
- Mapery mają testy jednostkowe w obie strony, czyli sprawdzamy, że po mapowaniu tam i z powrotem dostajemy to samo.

### 2.6 Odpowiedzi na pytania

**Dlaczego Spring Modulith?**

W DDD najważniejsze są granice kontekstów. W monolicie łatwo je przypadkiem złamać, zwłaszcza gdy dużo kodu pisze agent. Modulith daje cztery rzeczy, które inaczej trzeba by pisać ręcznie:
1. **Weryfikacja granic** jednym testem (`ApplicationModules.of(App.class).verify()`). Wykrywa cykle i odwołania do wewnętrznych pakietów innego modułu. Każdy PR to automatycznie sprawdza.
2. **Niezawodne zdarzenia między modułami:** `@ApplicationModuleListener` działa po commicie, asynchronicznie, z rejestrem publikacji w bazie (`event_publication`). Jeśli handler w `correspondence` padnie, zdarzenie `ApplicationSubmitted` nie zginie i zostanie ponowione. Na zwykłych zdarzeniach Springa trzeba by to pisać samemu.
3. **Testy modułu w izolacji** (`@ApplicationModuleTest`, `Scenario`): ładuje się tylko jeden moduł, a publikację i obsługę zdarzeń sprawdzamy deklaratywnie.
4. **Dokumentacja** (diagramy C4/PlantUML modułów) generowana z kodu. Przydaje się do prezentacji dla jury.

Kod wygenerowany z OpenAPI trafia do osobnego pakietu `api`, który w Modulith oznaczamy jako moduł współdzielony (`@ApplicationModule(type = OPEN)`). Kontrolery każdego modułu mogą z niego korzystać.

Koszt jest mały: jedna zależność i konwencja pakietów, bez zmian w stylu kodu. Z PipelinR się nie gryzie, bo PipelinR obsługuje komendy i zapytania wewnątrz modułu, a Modulith granice i zdarzenia między modułami. Alternatywa bez Modulith to ArchUnit plus `@TransactionalEventListener`, ale wtedy tracimy punkt 2. Jeśli wolisz prostotę, da się z niego zrezygnować w PR 02 bez wpływu na resztę planu.

**Dlaczego brak Springa?**

Precyzyjnie: Spring jest w każdym module, ale **nie w warstwie `domain`**. Handlery, adaptery, kontrolery i konfiguracja to zwykłe beany. Powody:
1. **Szybkie, proste testy.** Logika prawna to większość wartości projektu: zbieg tytułów, symulator zasiłku, terminy, oś czasu. Testy bez kontekstu Springa działają w milisekundach, więc agent może je uruchamiać po każdej zmianie.
2. **Model zależny tylko od przepisów.** Agregat `Child` czy `MaternityBenefitSimulator` nie wie nic o JPA, HTTP ani transakcjach. Adnotacje JPA wymuszają setery, puste konstruktory i leniwe ładowanie, a to rozmywa niezmienniki agregatu. Dlatego osobne encje JPA i MapStruct.
3. **Łatwe dla agenta.** Czysta funkcja „wejście → wynik” jest najprostsza do wygenerowania, przeglądu i porównania z `calc.js` w testach golden.
4. **Wymuszone testem.** ArchUnit: `domain` nie importuje `org.springframework..`, `jakarta.persistence..` ani `infrastructure..`.

Wyjątek pragmatyczny: moduł `knowledge` nie ma warstwy `domain` i jest zwykłym odczytem. Model treści i port `KnowledgeCatalog` leżą w `application.content`, adapter JSON w `infrastructure.content`.

### 2.7 Struktura pakietów

```
src/main/resources/openapi/openapi.yaml       // jedyne źródło prawdy o API
target/generated-sources/openapi/...          // wygenerowane: com.hn26.zaradniaki.zusbaby.api (interfejsy *Api)
                                              //               com.hn26.zaradniaki.zusbaby.api.model (DTO *Dto)
com.hn26.zaradniaki.zusbaby
├── shared            // kernel: Money, Rate, Weeks, DateRange, Check, cqrs/*, mapping/*, web/ProblemDetails
├── legalrules
│   ├── api/           // publikowane typy bez logiki (@NamedInterface)
│   │   ├── model/     ParameterKey, ParameterKind
│   │   └── exception/ LegalParametersNotFoundException
│   ├── domain/        ParameterSet, LegalParameters, ParameterValue, InvalidLegalParametersException,
│   │                  ParameterSetRepository (port)
│   ├── application/   query/ (publikowane), dto/ (publikowane), handler/, mapper/ (ParameterSet → DTO)
│   └── infrastructure/catalog (LegalState2026, InCodeParameterSetRepository)
│                      web (LegalParametersController, LegalParametersWebMapper)
├── calendar
├── benefits
├── guide
├── applications
├── correspondence
├── insuredaccount
├── identity
└── knowledge
```

### 2.8 Stos
Spring Boot 4.0.9, Java 25, Maven (jest). Do dodania:
- `spring-boot-starter-data-jpa`, PostgreSQL, Flyway, `spring-boot-starter-validation`
- `org.openapitools:openapi-generator-maven-plugin` (generator `spring`) + zależności wygenerowanego kodu (`jackson-databind-nullable` tylko gdy potrzebne, `swagger-annotations`)
- `net.sizovs:pipelinr`
- `org.projectlombok:lombok`, `org.mapstruct:mapstruct` + w `annotationProcessorPaths` w tej kolejności: `lombok`, `lombok-mapstruct-binding`, `mapstruct-processor`
- `spring-boot-starter-security` + `oauth2-resource-server` (JWT)
- `spring-boot-starter-thymeleaf` (strona mock mObywatel, szablony pism) + OpenHTMLtoPDF
- Spring Modulith (core, jpa, test) w wersji zgodnej z Boot 4
- Swagger UI wskazujący na statyczny `openapi.yaml` (springdoc-openapi-starter-webmvc-ui 3.0.x, linia dla Boot 4.0, `springdoc.swagger-ui.url=/api/v1/openapi.yaml`). Plik jest serwowany pod `/api/v1/openapi.yaml`. Za reverse proxy backend działa pod prefiksem (TEST: `/api/baby-zus-backend`); `server.forward-headers-strategy=framework` + nagłówek `X-Forwarded-Prefix` z proxy sprawiają, że adres specyfikacji w Swagger UI zawiera prefiks. Specyfikacji nie generujemy z kodu, bo źródłem jest plik. Swagger UI wymaga włączonego endpointu `api-docs`, więc zostaje włączony, ale z `springdoc.paths-to-match` ustawionym na nieistniejącą ścieżkę: `/v3/api-docs` jest celowo pusty (sprawdza to test IT).
- ArchUnit, Testcontainers PostgreSQL (`@ServiceConnection`), `openapi-request-validator-mockmvc` 3.0.0 (dawniej `swagger-request-validator-mockmvc`; zgodność żądań i odpowiedzi ze specyfikacją w testach IT, helper `OpenApiContract.matchesContract()`)

### 2.9 API first

Kolejność pracy nad każdym endpointem:
1. **Wpis w `src/main/resources/openapi/openapi.yaml`**: ścieżka, `operationId`, tag (= moduł), schematy request/response, błędy (`ProblemDetail`). Ten krok to osobny commit w PR, żeby przegląd zaczynał się od kontraktu.
2. **`./mvnw generate-sources`**: plugin generuje interfejs `*Api` i DTO.
3. **Kontroler** w `infrastructure.web` modułu implementuje interfejs `*Api`. Nie powtarza adnotacji mapowania, bo są w interfejsie.
4. **Mapper MapStruct** DTO ↔ rekord komendy/zapytania.
5. **Test IT** woła endpoint i waliduje żądanie oraz odpowiedź względem `openapi.yaml`.

Konfiguracja pluginu (szkic):

```xml
<plugin>
  <groupId>org.openapitools</groupId>
  <artifactId>openapi-generator-maven-plugin</artifactId>
  <executions>
    <execution>
      <goals><goal>generate</goal></goals>
      <configuration>
        <inputSpec>${project.basedir}/src/main/resources/openapi/openapi.yaml</inputSpec>
        <generatorName>spring</generatorName>
        <apiPackage>com.hn26.zaradniaki.zusbaby.api</apiPackage>
        <modelPackage>com.hn26.zaradniaki.zusbaby.api.model</modelPackage>
        <modelNameSuffix>Dto</modelNameSuffix>
        <generateSupportingFiles>false</generateSupportingFiles>
        <configOptions>
          <interfaceOnly>true</interfaceOnly>
          <useTags>true</useTags>               <!-- jeden interfejs *Api na tag/moduł -->
          <skipDefaultInterface>true</skipDefaultInterface>
          <useBeanValidation>true</useBeanValidation>
          <useJakartaEe>true</useJakartaEe>
          <openApiNullable>false</openApiNullable>
          <dateLibrary>java8</dateLibrary>
          <documentationProvider>none</documentationProvider>
          <useSpringBoot4>true</useSpringBoot4>   <!-- generator 7.27.0 -->
        </configOptions>
      </configuration>
    </execution>
  </executions>
</plugin>
```

Zasady specyfikacji:
- Jeden plik `openapi.yaml` (OpenAPI 3.0.3: generator i walidator w pełni obsługują 3.0, a 3.1 tylko częściowo), tag na moduł (`LegalParameters`, `Calculations`, `Guide`…), `operationId` w camelCase = nazwa metody w interfejsie.
- Wspólne schematy w `components`: `ProblemDetail` (z `gentleMessage`), `Money` (string dziesiętny), `Check`, `Deadline`.
- Gdy plik urośnie, dzielimy go na pliki per tag przez `$ref`. Wejście generatora się nie zmienia.
- Wygenerowane DTO to klasy (generator `spring` nie tworzy rekordów). Nie wychodzą poza `infrastructure.web`, bo mapper zamienia je na rekordy.

### 2.10 Lombok i rekordy

| Miejsce | Forma | Lombok |
|---|---|---|
| Komendy, zapytania, wyniki zapytań | `record` implementujący `Command<R>` | — |
| Value objects (`Money`, `Rate`, `Weeks`, `ChildId`, `Deadline`, `Check`…) | `record` z walidacją w konstruktorze kompaktowym | — |
| Zdarzenia domenowe i publiczne DTO modułów | `record` | — |
| Agregaty (`ParameterSet`, `Child`, `ParentProfile`, `ApplicationDraft`, `Document`…) | klasa | `@Getter`, `@EqualsAndHashCode(onlyExplicitlyIncluded = true)` (po id), `@ToString`. **Bez** `@Setter`, `@Data`, `@Builder` |
| Encje JPA | klasa | `@Getter`, `@Setter`, `@NoArgsConstructor(access = PROTECTED)` |
| Handlery, adaptery, kontrolery | klasa | `@RequiredArgsConstructor`, ewentualnie `@Slf4j` |
| Konfiguracja (`@ConfigurationProperties`) | `record` | — |

Lombok w warstwie `domain` jest dozwolony, bo działa tylko w czasie kompilacji i nie wiąże domeny z frameworkiem. Adnotacje Lomboka nie zostają w bajtkodzie, więc ArchUnit sprawdza skutek: klasy w `..domain..` nie mają publicznych metod `set*`.

## 3. API (prefiks `/api/v1`)

| Obszar | Endpoint | Dostęp |
|---|---|---|
| Parametry | `GET /legal-parameters` | publiczny |
| | `PUT /admin/legal-parameters`, `POST /admin/legal-parameters/reset`, `GET /admin/legal-parameters/history`, `POST /admin/auth` | ADMIN |
| Terminy | `GET /deadlines?event=&type=AFTER\|BEFORE&days=` albo `&months=` | publiczny |
| Kalkulacje | `POST /calculations/insurance` (zbieg tytułów), `POST /calculations/benefit-base` (Z-3), `POST /calculations/leave-dimensions` (wymiary urlopów), `POST /calculations/sickness-in-pregnancy`, `POST /calculations/maternity` | publiczny |
| Przewodnik | `POST /guide/preview` (ankieta gościa) | publiczny |
| | `GET /me/guide?childId=`, `PUT /me/children/{id}/tasks/{key}`, `POST /me/survey`, `GET/POST /me/children`, `PUT /me/active-child`, `POST/DELETE /me/support-mode` | USER |
| Treści | `GET /knowledge/chapters`, `/knowledge/articles/{id}`, `/knowledge/search?q=`, `/content/forms`, `/content/facts`, `/content/support`, `/content/week-cards` | publiczny |
| Tożsamość | `GET /auth/mobywatel/authorize`, `POST /auth/token`, `POST /auth/refresh`, `POST /auth/logout`, `GET /me` | — |
| eZUS | `GET /me/insurance`, `/me/sick-leaves`, `/me/contribution-balance`, `/me/calculator-prefill`, `POST /me/debt-certificates` | USER |
| Wnioski | `GET /wizards`, `GET /wizards/{id}`, `POST /wizards/{id}/letter` (PDF dla gościa) | publiczny |
| | `GET/PUT/DELETE /me/drafts/{wizardId}`, `POST /me/drafts/{wizardId}/validate`, `POST /me/drafts/{wizardId}/submit`, `GET /me/applications`, `GET /me/applications/{id}/pdf` | USER |
| Korespondencja | `GET /me/documents?box=inbox\|archive`, `GET /me/documents/{id}`, `PATCH /me/documents/{id}` | USER |
| Demo | `GET /demo/personas`, `POST /demo/events/birth`, `POST /demo/events/death`, `POST /demo/letters`, `POST /demo/reset` | profil `demo` |

Konwencje: błędy jako `ProblemDetail` z polem `gentleMessage`, daty ISO-8601, kwoty jako string dziesiętny. Kontrakt w `src/main/resources/openapi/openapi.yaml`, a Swagger UI wyświetla ten plik.

## 4. Model danych (Flyway)

```
user_account(id uuid, idp_subject text UNIQUE, persona_id text, roles text[], created_at)
auth_code(code_hash, subject, persona_id, redirect_uri, expires_at)          -- mock mObywatel
refresh_token(id, user_id, token_hash, expires_at, revoked_at)
parent_profile(user_id PK, role, work_forms text[], payer_size, partner_mode, mode, support_kind, active_child_id, version)
child(id uuid, user_id, name, kind, due_date, birth_date, taken_date, count,
      preterm_week, preterm_weight_g, preterm_hospital_days, za_zyciem, lost, version)
child_task(child_id, task_key, completed_at, PK(child_id, task_key))
application_draft(id, user_id, child_id, wizard_id, step_index, answers jsonb, updated_at, version,
                  UNIQUE(user_id, wizard_id, child_id))
application(id, user_id, child_id, wizard_id, kind, title, summary, answers jsonb, upo_number, pdf bytea, submitted_at)
document(id, user_id, sender, title, issued_on, summary, todo, body, offline, archived, read_at, source)
event_publication(...)                                                       -- Spring Modulith
```

Dane mock eZUS i person trzymamy w `resources/mock/` (JSON), nie w bazie, bo to dane „obcego systemu”.

## 5. Testy

| Poziom | Co | Narzędzia |
|---|---|---|
| Jednostkowe domeny | Polityki, kalkulatory, agregaty, VO (bez Springa) | JUnit 5, AssertJ, `@ParameterizedTest` |
| **Zgodność z makietą (golden)** | Te same wejścia w `calc.js` i w Javie, tolerancja 0,01 zł | Skrypt Node `tools/golden/generate.mjs` → `src/test/resources/golden/*.json` |
| Handlery | Komendy i zapytania PipelinR z repozytoriami in-memory | JUnit |
| Mapery | MapStruct w obie strony | JUnit |
| Modułowe | Granice, publikacja i obsługa zdarzeń | `@ApplicationModuleTest`, `Scenario` |
| Architektury | `domain` bez Springa i JPA; kontrolery wołają tylko `Pipeline` i implementują `*Api`; handlery leżą w `application.handler`; handler komendy ma `@Transactional`, a handler zapytania `@Transactional(readOnly = true)`; brak setterów w `domain` | ArchUnit + `ApplicationModules.verify()` |
| Integracyjne (`*IT`) | REST end-to-end, Flyway, JPA, security, PDF; żądania i odpowiedzi walidowane względem `openapi.yaml` | Testcontainers PostgreSQL, `MockMvc` + `OpenApiContract.matchesContract()`, failsafe |

## 6. Sposób pracy (ja + agent)

- **Jeden PR = jedno zadanie = jedna sesja agenta**, z briefem: cel, pliki, kryteria akceptacji, testy.
- Docelowa wielkość PR: **200–600 linii** (z testami).
- **Definition of Done:**
  - `./mvnw spotless:apply verify` przechodzi lokalnie i w CI.
  - Nowa logika domenowa ma testy jednostkowe, a nowy endpoint test `*IT`.
  - `ApplicationModules.verify()` i ArchUnit przechodzą.
  - Nowe lub zmienione endpointy są najpierw opisane w `openapi.yaml` (pierwszy commit PR), a kontroler implementuje wygenerowany interfejs.
  - Opis PR zawiera przykład z katalogu `http/`.
- Gałęzie `NN-krotka-nazwa` z `main` (np. `02-ddd-skeleton`), **bez prefiksów** typu `feature/` czy `hotfix/`. PR-y w kolejności z sekcji 7.

## 7. Plan PR-ów

**P0** wymagane na demo, **P1** ważne, **P2** gdy starczy czasu, **P3** opcjonalne.

Od PR 05 każdy PR z endpointem zaczyna się od wpisu w `openapi.yaml` (patrz 2.9). W tabelach to założone i niepowtarzane.

### Faza 0 — fundament
| # | PR | Zawartość | Testy | P |
|---|---|---|---|---|
| 01 | Infrastruktura projektu | JPA, Flyway, validation, Postgres, `compose.yaml`, poprawka `spring.application.name`, bean `Clock`, `DateTimeGenerator` + `FixedDateTimeGenerator` (testy) | `ContextLoadsIT` (Testcontainers) | P0 |
| 02 | Szkielet DDD i modułów | Spring Modulith, pakiety modułów, shared kernel (`Money`, `Rate`, `Weeks`, `DateRange`, `Check`), `ProblemDetail` + `gentleMessage` | Jednostkowe VO, `ModularityTest`, reguły ArchUnit (w tym zakaz `java.time.*.now()` poza `shared.time`) | P0 |
| 03 | CQRS, mapowanie, Lombok | Lombok, PipelinR (konfiguracja `Pipeline`, middleware logowania i walidacji, konwencja `application.command` / `application.query`), MapStruct (`@MapperConfig`, `ValueObjectMappers`), kolejność procesorów adnotacji, reguły ArchUnit (transakcje handlerów, brak setterów w `domain`) | Jednostkowe middleware, test przykładowego handlera (rekord `Command<R>`) i mappera | P0 |
| 04 | API first | `openapi.yaml` z `info`, wspólnymi schematami (`ProblemDetail`, `Money`, `Check`, `Deadline`) i endpointem `GET /api/v1/ping`, `openapi-generator-maven-plugin`, pierwszy kontroler implementujący `*Api`, pakiet `api` jako moduł OPEN w Modulith, Swagger UI na statycznym pliku, walidator specyfikacji w IT, CORS, katalog `http/`, `docs/glossary.md`, reguła ArchUnit „kontroler implementuje `*Api`” | `PingIT` z walidacją względem specyfikacji | P0 |

### Faza 1 — przepisy i obliczenia
| # | PR | Zawartość | Testy | P |
|---|---|---|---|---|
| 05 | Parametry prawne (odczyt) | Parametry w kodzie (`LegalState2026`), `ParameterSet`, `LegalParameters`, port i adapter z kodu, publikowane zapytania `GetCurrentLegalParametersQuery` i `GetLegalParametersEffectiveOnQuery`, `GET /legal-parameters` | Jednostkowe modelu, repozytorium i handlerów, IT | P0 |
| 06 | Kalendarz i terminy | `PolishHolidays`, `WorkingDays`, `DeadlinePolicy`, zapytanie `CalculateDeadlineQuery`, `GET /deadlines` | Parametryzowane (Wigilia, sobota, Boże Ciało, `before` w niedzielę), IT | P0 |
| 07 | Harness testów golden | `tools/golden/generate.mjs`, format fixture, bazowa klasa testu, fixture terminów | Golden: terminy | P0 |
| 08 | Zbieg tytułów i podstawa z Z-3 | `InsuranceTitles`, `InsuranceTitleResolver`, `BenefitBaseCalculator`, `BenefitParameters` (z zapytania `legalrules`), `POST /calculations/insurance`, `POST /calculations/benefit-base` | Jednostkowe + golden `resolvePerson`, `podstawaZ3` | P0 |
| 09 | Wymiary urlopów | `LeaveDimensionsPolicy`, `AdoptionLeavePolicy`, `SupplementaryLeavePolicy`, `LeaveParameters`, `POST /calculations/leave-dimensions` | Jednostkowe + golden `adoptWeeks`, `uzupelniajacy` | P0 |
| 10 | Zasiłek chorobowy w ciąży | `PregnancySicknessCalculator` (na tytułach z `InsuranceTitleResolver`), `SicknessParameters`, `IncomeTaxAdvance` (kwota na rękę), `POST /calculations/sickness-in-pregnancy` | Jednostkowe + golden `chorobowyCiaza`, `chorobowyMulti`, IT | P0 |
| 11 | Symulator macierzyńskiego, cz. 1: segmenty | `MaternityBenefitSimulator`: podział urlopu, przejęcie, uzupełniający, ojcowski, segmenty z datami i stawkami, kontrole uprawnień; `POST /calculations/maternity` (bez kwot) | Jednostkowe + golden (`segs`, `checks`) | P0 |
| 12 | Symulator macierzyńskiego, cz. 2: kwoty i praca | Kwoty segmentów i sumy, netto, minimum 1000 zł, łączenie z pracą i limity, `AlternativeBenefitPolicy`, komunikaty tytułów obojga rodziców złożone jak w `simOut()` (`MaternityBenefitCalculator`); rozszerzenie `POST /calculations/maternity` | Jednostkowe + golden `maternityBenefit` (z tytułów: segmenty z kwotami, `totals`, `checks`, `notes`, `zamiastZUS`), IT | P0 |

### Faza 2 — panel administracyjny
| # | PR | Zawartość | Testy | P |
|---|---|---|---|---|
| 13 | Admin: podgląd parametrów | Rola `ADMIN` (hasło → JWT) i podgląd parametrów (wersja, data obowiązywania, opis stanu prawnego, wartości) bez edycji. Zmiana wartości = nowa wersja w kodzie | IT: dostęp tylko dla `ADMIN` | P1 |

### Faza 3 — przewodnik bez logowania
| # | PR | Zawartość | Testy | P |
|---|---|---|---|---|
| 14 | Treści: Wiedza | Eksport `wiedza.js` → `content/knowledge.json` (`tools/content/export-content.mjs`), port `KnowledgeCatalog` z adapterem JSON, `GET /knowledge/chapters`, `GET /knowledge/articles/{id}`, `GET /knowledge/search?q=` (normalizacja jak `normTxt()`) | Jednostkowe normalizacji i wyszukiwania, IT | P1 |
| 15 | Treści: słowniki | Formularze, ciekawostki, karty tygodnia, organizacje, telefony, linki (`content/dictionaries.json`, port `DictionaryCatalog`), `GET /content/forms`, `/content/facts`, `/content/support`, `/content/week-cards`. Katalog świadczeń przechodzi do PR 16, bo ma reguły uprawnień (`eligible`) | Jednostkowe, IT | P1 |
| 16 | Przewodnik gościa | `Survey`, `TimelinePolicy`, `AlertPolicy`, `BenefitPlanPolicy` (z katalogiem świadczeń z `BENEFITS`), `WeekCardPolicy`, `PreviewGuide`, `POST /guide/preview` | Snapshot osi czasu dla każdej persony (`FixedDateTimeGenerator`), IT | P0 |

### Faza 4 — logowanie i eZUS
| # | PR | Zawartość | Testy | P |
|---|---|---|---|---|
| 17 | Mock mObywatel + JWT | Przepływ authorize → strona mock → code → token, refresh, logout, `GET /me`, persony jako tożsamości, `UserRegistered` | IT pełnego przepływu (code jednorazowy, wygasły, zły `state`) | P0 |
| 18 | Mock eZUS | `EzusGateway` + mock, przegląd ubezpieczenia, e-ZLA, saldo, prefill kalkulatora (MapStruct → `InsuranceTitles`) | Jednostkowe mapowania, IT z JWT | P0 |

### Faza 5 — profil zalogowanego
| # | PR | Zawartość | Testy | P |
|---|---|---|---|---|
| 19 | Profil i dzieci | `ParentProfile`, `Child`, encje i mapery, bootstrap z persony po `UserRegistered`, `CompleteSurvey`, `AddChild`, `SelectActiveChild`, `GET /me/guide` | Jednostkowe agregatów, `@ApplicationModuleTest`, IT | P0 |
| 20 | Zadania i tryb wsparcia | `CompleteTask`, `EnterSupportMode`, `ExitSupportMode`, demo `RegisterBirth`, `RegisterChildDeath` | Jednostkowe, IT | P1 |

### Faza 6 — korespondencja i wnioski
| # | PR | Zawartość | Testy | P |
|---|---|---|---|---|
| 21 | Korespondencja | `Document`, skrzynka, archiwum, przeczytanie, seed person, zaświadczenie o zadłużeniu, demo „nowe pismo” | Jednostkowe, `@ApplicationModuleTest`, IT | P1 |
| 22 | Kreatory: szkielet + `w-ojcowski` | `WizardDefinition`, kroki, walidacje, `ApplicationDraft`, `GET /wizards` | Jednostkowe walidacji (7 dni, 12 mies.), IT szkicu | P0 |
| 23 | Pisma PDF i składanie | `LetterRenderer`, `SubmitApplication`, `Application`, `ApplicationSubmitted` → `guide` i `correspondence`, `POST /wizards/{id}/letter` dla gościa | Jednostkowe, IT (PDF ma tekst, zdarzenie obsłużone) | P0 |
| 24 | Kreatory urlopowe | `w-81` (pismo), `w-rodzicielski`, `w-uzupelniajacy`, `w-adopcja`, `w-przejecie` | Jednostkowe walidacji | P1 |
| 25 | Wnioski do ZUS i gov.pl | `EzusSubmissionGateway` (UPO), `w-81` dla JDG (ZAM), `w-opiekunczy`, `w-pogrzebowy`, `w-odpis` | Jednostkowe, IT | P1 |

### Faza 7 — dodatki
| # | PR | Zawartość | P |
|---|---|---|---|
| 26 | Panel demo | `POST /demo/reset`, przegląd zdarzeń, profil `demo` | P2 |
| 27 | Wdrożenie | Obraz Docker, `compose` z frontendem (nginx) i Postgresem, workflow release | P1, gdy jest hosting |
| 28 | Kontakt | e-Wizyta (sloty z `calendar`), mama@zus.pl (zaślepka) | P3 |

**Ścieżka minimalna (MVP na demo):** 01, 02, 03, 04, 05, 06, 07, 08, 09, 10, 11, 12, 13, 16, 17, 18, 19, 22, 23, czyli 19 PR-ów.

## 8. Integracja z frontendem i serwisem asystenta

Kolejność przepinania frontendu:
1. `/api/params` → `GET /legal-parameters` i panel admina.
2. Kalkulator → `/calculations/*` (`calc.js` zostaje jako fallback offline).
3. Ankieta i przewodnik → `/guide/preview`, a po zalogowaniu `/me/guide`.
4. Logowanie mObywatel. Zamiast `zusData()` frontend woła `/me/insurance` i pokrewne.
5. Kreatory i wiadomości.

Serwis asystenta (LLM) jest osobny. Może pobierać z backendu aktualne parametry (`GET /legal-parameters`) i treści (`/knowledge/*`), żeby odpowiadał na tym samym stanie prawnym co kalkulator. `server.py` przestaje być potrzebny po stronie backendu. `/api/params` przejmuje PR 13, a `/api/chat` serwis asystenta.

## 9. Słownik pojęć (wycinek)

| Pojęcie (PL) | W kodzie |
|---|---|
| płatnik składek | `ContributionPayer` |
| ubezpieczony / świadczeniobiorca | `InsuredPerson` / `Beneficiary` |
| tytuł ubezpieczenia, zbieg tytułów | `InsuranceTitle`, `InsuranceTitleResolver` |
| podstawa wymiaru zasiłku | `BenefitBase` |
| zasiłek macierzyński / chorobowy / opiekuńczy / pogrzebowy | `MaternityBenefit` / `SicknessBenefit` / `CareBenefit` / `FuneralGrant` |
| urlop macierzyński / rodzicielski / ojcowski / uzupełniający | `MaternityLeave` / `ParentalLeave` / `PaternityLeave` / `SupplementaryMaternityLeave` |
| wynagrodzenie chorobowe | `SickPay` |
| świadczenie rehabilitacyjne | `RehabilitationBenefit` |
| okres wyczekiwania / okres zasiłkowy | `WaitingPeriod` / `BenefitPeriod` |
| wariant 81,5% (uśredniony) | `AveragedVariant` |
| przysposobienie / rodzina zastępcza | `Adoption` / `FosterFamily` |
| „Za życiem” | `ZaZyciemCertificate` (nazwa własna) |
| e-ZLA, UPO, Z-3, ZAM | bez tłumaczenia (kody formularzy) |
