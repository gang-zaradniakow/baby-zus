TL;DR

Asystent AI dla ZUS pomaga rodzicom sprawdzić, jakie zasiłki im przysługują: w ciąży, po porodzie, na urlopie rodzicielskim i/lub macierzyńskim i/lub wychowawczym i/lub ojcowskim. Mówi też, ile wyniosą i co trzeba załatwić. Działa na trzech poziomach. Najpierw jest lista gotowych pytań dopasowana do etapu rodzica i jego rodzaju ubezpieczenia. Potem, gdy pytania nie ma na liście, swobodna rozmowa z AI. Na końcu kontakt z urzędnikiem ZUS.

Najważniejsza zasada brzmi: liczby daje silnik reguł, słowa daje AI. Prawo do zasiłku, kwoty i okresy wylicza przewidywalny program, a AI tylko tłumaczy wynik prostym językiem. Odpowiedź, w której AI poda liczbę spoza wyliczeń silnika, jest odrzucana. Każda odpowiedź ma werdykt (TAK, NIE albo „potrzebne dodatkowe informacje”), uzasadnienie i podstawę prawną z linkiem. Asystent sam ostrzega o ryzykach i terminach, w trudnych sytuacjach mówi osobnym, delikatnym tonem, a stawki i limity można zmieniać w panelu bez przeprogramowania.

*Na hackathon zakres jest celowo wąski*. Obejmuje kilka typów ubezpieczenia, pytania o uprawnienia, wysokość świadczeń, urlopy i dokumenty, kalkulator oraz eskalację do urzędnika. Celem jest 100% zgodności wyliczeń z przykładowymi sprawami ZUS. Asystent podaje informację, a nie decyzję: wiążąco rozstrzyga zawsze ZUS albo pracodawca.

\## 1. Cel i założenia  

Asystent odpowiada rodzicowi na pytania o zasiłki/świadczenia z ubezpieczenia (ciąża, macierzyństwo, rodzicielstwo, adopcja, rodzina zastępcza) w trzech krokach: gotowe pytania dopasowane do etapu, swobodna rozmowa z LLM podłączonym do danych przez MCP, a na końcu kontakt z urzędnikiem ZUS. Każda odpowiedź jest spersonalizowana, ma uzasadnienie i podstawę prawną.  

Problem, który rozwiązuje: brak wiedzy o uprawnieniach i ryzyku ich utraty, trudne sytuacje szczególne (martwe urodzenie, wcześniak, choroba lub śmierć matki), niejasna wysokość zasiłku, skomplikowane dokumenty i zmiany zatrudnienia w ciąży.  

Zasady projektowe  

1. Liczby z silnika reguł, słowa z LLM. Prawo do świadczenia, okresy i kwoty wylicza deterministyczny silnik; LLM tylko tłumaczy wynik i prowadzi rozmowę. Model nigdy nie podaje kwoty ani liczby tygodni „z pamięci”.  
2. Każda odpowiedź ma źródło. Artykuł ustawy zasiłkowej, Kodeksu pracy lub rozporządzenia + link do zus.pl / gov.pl / pip.gov.pl.  
3. Trzy możliwe werdykty: TAK / NIE / POTRZEBNE DODATKOWE INFORMACJE. Brak danych to nie „nie”, tylko konkretne pytanie o brakujący fakt.  
4. Informacja, nie decyzja. Asystent symuluje uprawnienia; wiążąco rozstrzyga ZUS albo płatnik składek. Komunikat o tym jest stały, ale krótki. (Przykładowo: “Informacja została wygenerowana przez sztuczną inteligencję. Pamiętaj, że może się mylić.”)  
5. Parametry ustawiane w kodzie. Stawki, wymiary urlopów, okresy wyczekiwania, limity itp. wynikają z przepisów prawnych. W sytuacji zmiany przepisów starą część kodu trzeba będzie wykomentować i dodać poprawioną wersję (lub poprawioną wersję z odpowiednim commitem umieścić w repozytorium).  
6. Empatia w sytuacjach trudnych. Osobny ton i ścieżka dla poronienia, martwego urodzenia, śmierci dziecka, ciężkiej choroby.

7.Źródłem danych jest backend. Backend będzie wystawiał endpoint dostarczający informację o etapie dla danego dziecka i pozostałe informacje potrzebne do przetworzenia.  

Odbiorcy: osoby planujące rodzicielstwo, kobiety w ciąży, ojcowie, rodzice adopcyjni i zastępczy niezawodowi, a płatnicy składek.  

## 2. Model działania: trzy poziomy  

Użytkownik zawsze zaczyna od krótkiej listy pytań dla swojego etapu; asystent LLM włącza się dopiero po wybraniu „INNE”, a urzędnik – gdy LLM nie da rady albo użytkownik tego chce.  

W każdym poziomie kwoty i okresy pochodzą z tego samego silnika reguł, więc odpowiedź z listy i z rozmowy z LLM jest zawsze spójna.  

- Poziom 1 – lista pytań. Szybko, bez AI, w pełni testowalne. Pokrywa katalog A–H (§4).  
- Poziom 2 – INNE. LLM rozpoznaje pytanie, pobiera dane przez MCP (§7), wywołuje kalkulator i tłumaczy wynik. Jeśli pytanie pasuje do intencji z katalogu, LLM proponuje kartę z poziomu 1.  
- Poziom 3 – kontakt z ZUS.  

Każde pytanie z poziomów 2 i 3 trafia do analityki w panelu; często powtarzane pytania są kandydatami do dopisania do listy z poziomu 1.  

## 3. Personalizacja: etap × profil  

Lista pytań i treść odpowiedzi zależą od dwóch wymiarów: etapu ścieżki rodzica (co jest teraz istotne) i profilu ubezpieczenia (kto liczy i wypłaca zasiłek). Ustalane mogą być dwutorowo -albo po zalogowaniu mObywatelem, lub bez potrzeby logowania, ale użytkownik musi wtedy w formularzu wypisać niezbędnę dane do pozyskania informacji.  

### 3.1 Etapy ścieżki  

| Etap | Jak go rozpoznajemy | Co asystent eksponuje na górze listy |  
| --- | --- | --- |  
| E0 Ciąża | podana przewidywana data porodu (PDP) | zasiłek chorobowy 100% z kodem „B”, e-ZLA, ochrona przed zwolnieniem, przedłużenie umowy terminowej |  
| E1 Przed porodem | ≤ 6 tygodni do PDP | urlop macierzyński przed porodem, wniosek jednorazowy (macierzyński + rodzicielski), wybór 81,5% vs 100%/70% |  
| E2 Po porodzie | data urodzenia w profilu | termin 21 dni na wniosek 81,5%, dokumenty, akt urodzenia, urlop ojcowski, uzupełniający urlop macierzyński |  
| E3 Urlop rodzicielski i powrót | koniec urlopu macierzyńskiego | podział 41/43 tyg. i 9 tyg. nieprzenoszalnych, łączenie z pracą ≤ ½ etatu, 5 części do końca roku 6. urodzin |  
| E4 Adopcja / rodzina zastępcza | flaga „przyjęcie dziecka na wychowanie” | urlop na warunkach macierzyńskiego, limity wieku 7/10/14 lat, ojcowski do 12 mies. od uprawomocnienia |  
| E5 Sytuacja trudna | wybór użytkownika lub słowa kluczowe w rozmowie | martwe urodzenie, zgon dziecka (8 tyg. / 7 dni), wcześniak, „Za życiem”, hospitalizacja matki, organizacje wsparcia |

Dodatkowo mamy tu jeszcze kwestię urlopu ojcowskiego.


Etapy nie wykluczają się: E6 i E5 nakładają się na dowolny inny etap.  

### 3.2 Profil ubezpieczenia (dla każdego rodzica osobno)  

| Profil | Okres wyczekiwania | Kto wypłaca | Dokumenty |  
| --- | --- | --- | --- |  
| Umowa o pracę, płatnik > 20 ubezpieczonych | 30 dni | pracodawca | wniosek o urlop, e-ZLA |  
| Umowa o pracę, płatnik ≤ 20 ubezpieczonych | 30 dni | ZUS | wniosek o urlop + Z-3 od pracodawcy |  
| Umowa zlecenia (dobrowolne chorobowe) | 90 dni | płatnik > 20 albo ZUS | ZAM + Z-3a |  
| Działalność gospodarcza (dobrowolne chorobowe) | 90 dni | ZUS | ZAM / ZAS-53, sprawdzenie zadłużenia składkowego |  
| Brak ubezpieczenia chorobowego | — | — | werdykt NIE + odesłanie do wsparcia spoza ubezpieczenia chorobowego (np. świadczenie rodzicielskie – do weryfikacji, który organ obecnie je wypłaca) |  

Próg „20 ubezpieczonych” liczy się według stanu na 30 listopada poprzedniego roku (art. 61 ustawy zasiłkowej). Asystent nie pyta o to użytkownika, tylko pobiera z symulowanych danych płatnika.  

### 3.3 Dane wejściowe profilu  

- Z ZUS: tytuły ubezpieczenia i okresy podlegania, podstawa wymiaru składek z 12 miesięcy, e-ZLA, zadłużenie, liczba ubezpieczonych u płatnika.

\-Z formularza (opcja bez potrzeby logowania)  
- Od użytkownika lub jeśli jest wiadoma to z backendu: PDP (planowana data porodu) lub data porodu, liczba dzieci przy jednym porodzie, zdarzenia szczególne (wcześniak, hospitalizacja, „Za życiem”), plan podziału urlopu, planowany wymiar pracy, dane drugiego rodzica.  


## 4. Katalog pytań (A–H)  

Każde pytanie z listy jest intencją z przypisanym typem odpowiedzi, wymaganymi danymi i etapami, na których się pokazuje. Dzięki temu lista jest krótka (5–8 pytań na ekranie), a pytania spoza etapu są dostępne w wyszukiwarce. Pytania oznaczone ➕ to propozycje dopisane do Twojego szkicu.  

Typy odpowiedzi: W = werdykt (TAK/NIE/POTRZEBNE INFO) · K = kalkulator (kwota/okres) · P = procedura (dokumenty, kroki) · I = informacja z bazy wiedzy · S = symulacja wariantów.  

### A. Uprawnienia do świadczeń  

| Intencja | Typ | Etapy | Dane wymagane |  
| --- | --- | --- | --- |  
| Czy przysługuje mi zasiłek macierzyński? | W | E1–E5 | tytuł ubezpieczenia, ciągłość do dnia porodu/przyjęcia |  
| Czy przysługuje mi zasiłek chorobowy w ciąży? | W | E1–E2 | tytuł, okres wyczekiwania 30/90 dni, e-ZLA z kodem „B” |  
| Czy mam prawo do świadczenia rehabilitacyjnego? | W | E1–E2 | wyczerpanie 270 dni okresu zasiłkowego, rokowanie |  
| Czy przysługuje mi zasiłek w wysokości zasiłku macierzyńskiego? ➕ | W | E1–E2 | przyczyna rozwiązania umowy (upadłość, likwidacja, śmierć pracodawcy, wyrok sądu) |  
| Czy przysługuje mi zasiłek opiekuńczy? | W/I | E3–E4 | wiek dziecka, choroba dziecka, zbieg z urlopem rodzicielskim |  
| Czy przysługują mi świadczenia przy działalności gospodarczej? | W | wszystkie | dobrowolne chorobowe, 90 dni, opłacone składki |  
| Czy otrzymam świadczenie na umowie zlecenia? | W | wszystkie | dobrowolne chorobowe, 90 dni, płatnik |  
| Czy przysługuje mi świadczenie bez ubezpieczenia chorobowego? | W | wszystkie | potwierdzenie braku tytułu → NIE + alternatywy |  
| Czy po ustaniu umowy nadal dostanę zasiłek? ➕ | W | E1–E3 | data ustania, data niezdolności/porodu |  

### B. Wysokość świadczeń  

| Intencja | Typ | Etapy | Dane wymagane |  
| --- | --- | --- | --- |  
| Ile wyniesie mój zasiłek macierzyński? | K | E1–E5 | podstawa wymiaru (12 mies.), wariant 81,5% vs 100%/70% |  
| Ile wyniesie zasiłek chorobowy w ciąży? | K | E1–E2 | podstawa, liczba dni z e-ZLA |  
| Jaka będzie miesięczna kwota? | K | E2–E4 | jw. |  
| Jak zmieni się kwota przy różnych wariantach urlopu? | S | E2–E4 | wariant ciągły 81,5% vs 100% + 70%, podział między rodziców |  
| Jak obliczana jest podstawa wymiaru? | I/K | wszystkie | składniki z Z-3/Z-3a, składki, okresy ubezpieczenia < 12 mies. |  
| Ile otrzymam łącznie w całym okresie? | K | E2–E4 | suma okresów × stawki |  
| Co się stanie, jeśli zmienię etat lub pensję w ciąży? ➕ | S/W | E1 | zmiana podstawy, ryzyko weryfikacji przez ZUS |  

### C. Urlopy i czas trwania świadczeń  

| Intencja | Typ | Etapy | Dane wymagane |  
| --- | --- | --- | --- |  
| Ile tygodni urlopu macierzyńskiego mi przysługuje? | K | E1–E3 | liczba dzieci przy jednym porodzie |  
| Ile tygodni urlopu rodzicielskiego mogę wykorzystać? | K | E2–E4 | liczba dzieci, „Za życiem”, 9 tyg. nieprzenoszalnych |  
| Czy drugi rodzic może przejąć część urlopu? | W | E2–E4 | min. 14 tyg. matki, wyjątki (hospitalizacja, niezdolność, śmierć) |  
| Ile czasu mam na złożenie wniosku? | P | E2–E4 | rodzaj wniosku (np. 21 dni na wariant 81,5%) |  
| Jak długo mogę pobierać świadczenie? | K | wszystkie | rodzaj zasiłku (270 dni chorobowego, wymiar urlopu) |  
| Jakie uprawnienia przy więcej niż jednym dziecku? | K | E1–E4 | liczba dzieci |  
| Kiedy mogę zacząć urlop przed porodem? ➕ | P | E1–E2 | PDP, zaświadczenie o przewidywanej dacie porodu (max 6 tyg.) |  
| Ile mam czasu na urlop ojcowski? ➕ | K | E3–E5 | data urodzenia / uprawomocnienia przysposobienia |  

### D. Sytuacja drugiego rodzica  

| Intencja | Typ | Etapy | Dane wymagane |  
| --- | --- | --- | --- |  
| Czy drugi rodzic też ma prawo do świadczeń? | W | E1–E5 | profil ubezpieczenia drugiego rodzica |  
| Jak możemy podzielić urlop rodzicielski? | S | E2–E4 | wymiar, 9+9 tyg., maks. 5 części, równoległo/naprzemiennie |  
| Czy oboje możemy korzystać jednocześnie? | W/S | E3–E4 | łączny wymiar nie przekracza puli |  
| Czy podział wpłynie na wysokość świadczeń? | S | E2–E4 | podstawy obojga, stawki |  
| Czy drugi rodzic może pracować na urlopie rodzicielskim? | W/K | E4 | wymiar pracy ≤ ½ etatu |  
| Co, jeśli matka nie była ubezpieczona w dniu porodu? ➕ | W | E3 | prawo ojca do rodzicielskiego i ojcowskiego |  
| Czy ojciec może wcześniej przejąć urlop macierzyński? ➕ | W | E3 | hospitalizacja, orzeczenie o niezdolności do samodzielnej egzystencji, śmierć, porzucenie |  

### E. Praca podczas pobierania świadczeń  

| Intencja | Typ | Etapy | Dane wymagane |  
| --- | --- | --- | --- |  
| Czy mogę pracować podczas urlopu rodzicielskiego? | W | E4 | u tego samego pracodawcy, ≤ ½ etatu |  
| Czy mogę prowadzić działalność podczas pobierania zasiłku? | W/I | E3–E4 | tytuł ubezpieczenia, rodzaj pracy |  
| Jak praca wpłynie na wysokość zasiłku? | K | E4 | wymiar pracy, podstawa |  
| Czy mogę łączyć pracę z częścią urlopu? | W/S | E4 | która część, wymiar |  
| Jak wydłuży się urlop przy łączeniu z pracą? | K | E4 | wymiar pracy → proporcjonalne wydłużenie (limit z Kodeksu pracy) |  
| Czy mogę pracować na zwolnieniu w ciąży? ➕ | W/I | E1 | e-ZLA, ryzyko utraty zasiłku za okres pracy |  

### F. Sytuacje szczególne  

| Intencja | Typ | Etapy | Dane wymagane |  
| --- | --- | --- | --- |  
| Co jeśli dziecko urodzi się przedwcześnie? | K/P | E3 | uzupełniający urlop macierzyński, zaświadczenie ze szpitala |  
| Co jeśli dziecko wymaga hospitalizacji? | K/P | E3 | jw. (dziecko donoszone, ale hospitalizowane) |  
| Jakie uprawnienia przy większej liczbie dzieci? | K | E1–E4 | liczba dzieci przy jednym porodzie |  
| Jakie świadczenia mają rodzice adopcyjni? | K/W | E5 | wiek dziecka (≤ 14 lat), wniosek do sądu o przysposobienie |  
| Jakie prawa mają rodzice zastępczy? | K/W | E5 | rodzina niezawodowa, wiek ≤ 7 lat (≤ 10 przy odroczeniu obowiązku szkolnego) |  
| Co w przypadku martwego urodzenia lub śmierci dziecka? | W/K/P | E6 | data zgonu, wiek dziecka w tygodniach, liczba dzieci przy życiu |  
| Co w przypadku ciężkiej choroby dziecka („Za życiem”)? | K | E3–E6 | zaświadczenie „Za życiem” → wydłużony urlop rodzicielski |  
| Co jeśli matka jest w szpitalu, zmarła lub porzuciła dziecko? ➕ | W/K | E3–E6 | zdarzenie, daty → przejęcie urlopu przez ojca |  
| Co po poronieniu? ➕ | I/W | E6 | wiek ciąży, dokumenty medyczne → odesłanie do ZUS i organizacji wsparcia |  

### G. Dokumenty, wnioski i terminy  

| Intencja | Typ | Etapy | Dane wymagane |  
| --- | --- | --- | --- |  
| Jakie dokumenty muszę przygotować? | P | wszystkie | profil, rodzaj zasiłku, zdarzenia szczególne |  
| Gdzie złożyć wniosek? | P | wszystkie | płatnik > 20 ubezpieczonych → pracodawca, inaczej ZUS |  
| Jaki formularz ZUS wypełnić? | P | wszystkie | ZAM (po 24.10.2026 obejmuje też dawne ZUR i ZAO), ZAS-53, Z-3/Z-3a, ZAS-12 |  
| Do kiedy złożyć dokumenty? | P | wszystkie | rodzaj wniosku, data zdarzenia |  
| Kto wypłaci świadczenie – ZUS czy pracodawca? | W | wszystkie | liczba ubezpieczonych u płatnika na 30.11 poprzedniego roku |  
| Jak sprawdzić status wniosku? | P | E2–E5 | symulacja PUE/eZUS |  
| Jak uzyskać akt urodzenia dziecka? ➕ | P | E3 | symulacja wniosku o odpis zupełny/skrócony (gov.pl) |  
| Jak napisać wniosek o urlop do pracodawcy? ➕ | P | E2–E4 | generator wniosku (macierzyński, rodzicielski, ojcowski, rezygnacja) |  

### H. Ryzyka i utrata uprawnień  

| Intencja | Typ | Etapy | Dane wymagane |  
| --- | --- | --- | --- |  
| Co może spowodować utratę prawa do świadczenia? | I/W | wszystkie | profil, historia ubezpieczenia |  
| Czy zmiana zatrudnienia wpłynie na moje uprawnienia? | S/W | E1–E2 | planowana zmiana i jej data |  
| Czy przerwa w ubezpieczeniu chorobowym ma znaczenie? | W | E1–E2 | przerwy w okresach podlegania (wliczanie okresów do wyczekiwania) |  
| Czy zadłużenie w ZUS wpłynie na wypłatę? | W | wszystkie (JDG) | zadłużenie na dzień powstania prawa (symulacja zaświadczenia) |  
| Jakie konsekwencje ma zbyt późne złożenie wniosku? | I | E2–E4 | rodzaj wniosku (np. utrata wariantu 81,5% po 21 dniach) |  
| Czy ZUS może zakwestionować moją umowę lub podstawę? ➕ | I/W | E1 | data zawarcia umowy vs ciąża, skok podstawy wymiaru |  
| Czy pracodawca może mnie zwolnić w ciąży lub na urlopie? ➕ | I | E1–E4 | rodzaj umowy (ochrona tylko dla pracowników), umowa terminowa > 1 mies. |  

## 5. Standard odpowiedzi  

Każda odpowiedź – z listy czy z LLM – ma tę samą strukturę w 6 blokach, a interfejs renderuje ją jako kartę. Dzięki temu odpowiedzi są porównywalne, testowalne i łatwe do audytu.  

1. Werdykt – TAK / NIE / POTRZEBNE DODATKOWE INFORMACJE (dla typów K i S: kwota i okres jako nagłówek).  
2. Krótko po ludzku – 1–2 zdania bez żargonu.  
3. Dlaczego – fakty z profilu, które zdecydowały („podlegasz dobrowolnemu ubezpieczeniu chorobowemu od 12.03.2026, czyli dłużej niż 90 dni”).  
4. Wyliczenie i założenia – wzór, podstawa, stawka, liczba dni; wyraźnie oznaczone dane wpisane przez użytkownika vs pobrane z ZUS.  
5. Podstawa prawna – artykuł + link do źródła (zus.pl, gov.pl, pip.gov.pl).  
6. Co dalej – 1–3 przyciski akcji: „Wypełnij ZAM”, „Przelicz wariant”, „Ustaw przypomnienie”, „Zapytaj urzędnika”.  

Przy werdykcie POTRZEBNE DODATKOWE INFORMACJE blok 3 zamienia się w listę brakujących faktów, a każdy ma pole do uzupełnienia lub przycisk „Pobierz z ZUS”.  

### 5.1 Kontrakt danych odpowiedzi (REST API)  

\`\`\`json  
{  
  "intentId": "B.01_wysokosc_macierzynskiego",  
  "verdict": "YES | NO | NEED_INFO",  
  "summary": "string",  
  "facts": \[{"label": "string", "value": "string", "source": "ZUS | USER | DOCUMENT"}\],  
  "calculation": {  
    "base": 0, "rate": 0.815, "periods": \[{"type": "MACIERZYNSKI", "from": "date", "to": "date", "rate": 0.815, "amount": 0}\],  
    "monthly": 0, "total": 0, "assumptions": \["string"\]  
  },  
  "missing": \[{"field": "string", "question": "string"}\],  
  "legalBasis": \[{"act": "ustawa zasiłkowa", "article": "art. 31", "url": "string"}\],  
  "actions": \[{"type": "FORM | SIMULATE | REMINDER | ESCALATE", "label": "string"}\],  
  "engineVersion": "params-2026-10-24",  
  "generatedBy": "RULES | LLM_EXPLAINED"  
}  
\`\`\`  

Pole \`engineVersion\` wskazuje zestaw parametrów z panelu administracyjnego, według którego liczono – ważne przy zmianach przepisów i odwołaniach. Numery artykułów w \`legalBasis\` pochodzą z bazy wiedzy (wyciąg przepisów od ZUS), nie z modelu.

| Pole                            | Co zawiera                                                                                       | Po co frontendowi                                                                                                                                                                                                                                   |
|---------------------------------|--------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `intentId`                      | Identyfikator pytania z katalogu A–H, np. `B.01_wysokosc_macierzynskiego`                        | Wybiera właściwy szablon karty i tytuł pytania, służy do analityki (które pytania są zadawane) i pozwala połączyć odpowiedź z kartą z poziomu 1, gdy pytanie zadano przez LLM.                                                                      |
| `verdict`                       | `YES`, `NO` albo `NEED_INFO`                                                                     | **Blok 1.** Decyduje o wyglądzie karty: kolor, ikona, nagłówek. Przy `NEED_INFO` zamiast faktów pokazuje się formularz braków. Przy `NO` karta ma ton rzeczowy z alternatywą.                                                                       |
| `summary`                       | 1–2 zdania prostym językiem                                                                      | **Blok 2** („Krótko po ludzku”). Tekst pod nagłówkiem, który użytkownik czyta jako pierwszy. Przy odpowiedzi z LLM to jedyne miejsce na swobodny tekst.                                                                                             |
| `facts[]`                       | Lista faktów, które zdecydowały o wyniku                                                         | **Blok 3** („Dlaczego”). Lista uzasadnień, np. „Podstawa wymiaru: 6 000 zł”.                                                                                                                                                                        |
| `facts[].label` / `.value`      | Nazwa faktu i jego wartość                                                                       | Etykieta i wartość w wierszu listy.                                                                                                                                                                                                                 |
| `facts[].source`                | Skąd pochodzi fakt: `ZUS`, `USER` albo `DOCUMENT`                                                | Wyświetla oznaczenie źródła (np. „z ZUS”, „wpisane przez Ciebie”). Przy `USER` może pokazać przycisk „Popraw” albo „Pobierz z ZUS”. Spełnia wymóg odróżnienia danych deklarowanych od pobranych.                                                    |
| `calculation`                   | Wynik kalkulatora; dla werdyktów bez kwot może być pusty                                         | **Blok 4** („Wyliczenie i założenia”). Rozwijana sekcja ze wzorem. Przy typach K i S zasila też nagłówek z kwotą w bloku 1.                                                                                                                         |
| `calculation.base`              | Podstawa wymiaru w zł                                                                            | Pokazuje, od czego liczono kwotę.                                                                                                                                                                                                                   |
| `calculation.rate`              | Główna stawka, np. `0.815`                                                                       | Wyświetlana jako procent („81,5%”).                                                                                                                                                                                                                 |
| `calculation.periods[]`         | Kolejne okresy świadczenia z typem, datami od–do, stawką i kwotą                                 | Oś czasu lub tabela okresów, np. 20 tyg. po 100% i potem 32 tyg. po 70%. Pozwala narysować porównanie wariantów.                                                                                                                                    |
| `calculation.monthly`           | Kwota miesięczna brutto                                                                          | Główna liczba na karcie (nagłówek w bloku 1).                                                                                                                                                                                                       |
| `calculation.total`             | Suma za cały okres                                                                               | Wartość „łącznie” i podstawa do porównania wariantów.                                                                                                                                                                                               |
| `calculation.assumptions[]`     | Założenia przyjęte do wyliczenia                                                                 | Lista „Przyjęliśmy, że…”, np. jedno dziecko albo brak „Za życiem”. Pokazuje użytkownikowi, co może zmienić wynik.                                                                                                                                   |
| `missing[]`                     | Brakujące dane; puste, gdy werdykt to nie `NEED_INFO`                                            | Zastępuje blok 3 przy `NEED_INFO`. Każdy element staje się polem formularza.                                                                                                                                                                        |
| `missing[].field`               | Techniczna nazwa pola profilu                                                                    | Mówi, które pole profilu zaktualizować po odpowiedzi użytkownika i czy da się je pobrać przyciskiem „Pobierz z ZUS”.                                                                                                                                |
| `missing[].question`            | Pytanie dla użytkownika                                                                          | Etykieta pola formularza lub kolejne pytanie w czacie.                                                                                                                                                                                              |
| `legalBasis[]`                  | Przepisy uzasadniające odpowiedź                                                                 | **Blok 5** („Podstawa prawna”). Lista przepisów z linkami.                                                                                                                                                                                          |
| `legalBasis[].act` / `.article` | Nazwa aktu i numer artykułu                                                                      | Tekst linku, np. „art. 31 ustawy zasiłkowej”.                                                                                                                                                                                                       |
| `legalBasis[].url`              | Link do zus.pl, gov.pl albo pip.gov.pl                                                           | Adres, który otwiera się po kliknięciu.                                                                                                                                                                                                             |
| `actions[]`                     | Proponowane następne kroki                                                                       | **Blok 6** („Co dalej”). 1–3 przyciski pod kartą.                                                                                                                                                                                                   |
| `actions[].type`                | `FORM`, `SIMULATE`, `REMINDER` albo `ESCALATE`                                                   | Mówi, co zrobić po kliknięciu: otworzyć formularz (np. ZAM), otworzyć kalkulator wariantów, ustawić przypomnienie albo rozpocząć kontakt z urzędnikiem.                                                                                             |
| `actions[].label`               | Tekst przycisku                                                                                  | Napis na przycisku, np. „Wypełnij wniosek”.                                                                                                                                                                                                         |
| `engineVersion`                 | Wersja zestawu parametrów z panelu, np. `params-2026-10-24`                                      | Drobny dopisek w stopce karty („wyliczono wg parametrów z…”). Przydaje się przy zgłoszeniu błędu, odwołaniu i eskalacji, bo trafia do paczki dla urzędnika. Gdy zmienią się przepisy, frontend może zaproponować ponowne przeliczenie starej karty. |
| `generatedBy`                   | `RULES`, gdy odpowiedź w całości pochodzi z silnika, albo `LLM_EXPLAINED`, gdy tekst napisał LLM | Wyświetla oznaczenie „Odpowiedź przygotowana z pomocą AI”, wymagane przez AI Act i regulamin wyzwania. Pomaga też w analityce porównywać odpowiedzi z poziomu 1 i z poziomu 2.                                                                      |



### 5.2 Przykład karty (ilustracyjny)  

> \*\*Pytanie:\*\* Ile wyniesie mój zasiłek macierzyński?  
>  
> \*\*Werdykt:\*\* ok. 4 890 zł brutto miesięcznie przez 52 tygodnie (wariant 81,5%) albo 6 000 zł przez 20 tyg. i 4 200 zł przez 32 tyg. (wariant 100% + 70%).  
>  
> \*\*Dlaczego:\*\* podstawa wymiaru 6 000 zł (średnia z 12 miesięcy z Z-3); jedno dziecko; brak „Za życiem”.  
>  
> \*\*Uwaga:\*\* wariant 81,5% wymaga wniosku do 21 dni po porodzie – zostało 9 dni. \*\*\\\[Wypełnij wniosek\\\] \\\[Porównaj warianty\\\] \\\[Ustaw przypomnienie\\\]\*\*  

Kwoty w przykładzie są umowne; w aplikacji liczy je silnik na podstawie danych sprawy.  

## 6. Silnik reguł vs LLM  

Rozstrzygnięcie i liczby daje silnik reguł; LLM rozumie pytanie, zbiera brakujące dane i tłumaczy wynik. To chroni przed halucynacjami i spełnia wymóg ZUS, żeby jury mogło sprawdzić poprawność wyliczeń na przykładowych sprawach.  

| Zadanie | Silnik reguł | LLM |  
| --- | --- | --- |  
| Rozpoznanie intencji z wolnego tekstu | — | mapuje pytanie na intencję z katalogu A–H albo „poza katalogiem” |  
| Ustalenie prawa do zasiłku (werdykt) | tak | — |  
| Okresy, daty, kwoty, podział urlopu | tak (kalkulator zintegrowany) | — |  
| Pytania o brakujące dane | lista brakujących pól | zamienia listę na naturalne pytania, po jednym |  
| Wyjaśnienie wyniku | struktura + fakty | treść bloków „Krótko po ludzku” i „Dlaczego” |  
| Podstawa prawna | identyfikator przepisu | cytuje z bazy wiedzy (RAG), nie z pamięci |  
| Pytania spoza katalogu | — | odpowiedź z RAG + narzędzi MCP albo eskalacja |  

**Reguła twarda**: jeśli odpowiedź LLM zawiera kwotę, datę lub liczbę tygodni, której nie ma w wyniku silnika, odpowiedź jest odrzucana przez walidator i generowana ponownie.  

### 6.1 Parametry w panelu administracyjnym  

Każdy parametr ma wartość, datę obowiązywania od/do i źródło prawne. Silnik wybiera zestaw obowiązujący w dniu zdarzenia (np. porodu). Wszystkie parametry, które wynikają z ustaw wbudowane będą w kod. W panelu były by one wyświetlane jako "tylko do odczytu".  

| Parametr | Wartość wg materiałów ZUS |  
| --- | --- |  
| Stawka: macierzyński, na warunkach macierzyńskiego, uzupełniający, ojcowski | 100% |  
| Stawka: rodzicielski | 70% |  
| Stawka: wariant jednolity (wniosek do 21 dni po porodzie) | 81,5% |  
| Stawka: chorobowy w ciąży (kod „B”) | 100% |  
| Okres wyczekiwania: obowiązkowe / dobrowolne | 30 / 90 dni |  
| Okres zasiłkowy | 270 dni |  
| Wynagrodzenie chorobowe od pracodawcy | 33 dni (14 dni po 50. r.ż.) |  
| Urlop macierzyński, 1 dziecko | 20 tyg., w tym 14 tyg. obowiązkowo przez matkę |  
| Urlop macierzyński przed porodem | maks. 6 tyg. |  
| Urlop rodzicielski | 41 / 43 tyg., 9 tyg. nieprzenoszalnych na rodzica, maks. 5 części |  
| Termin wykorzystania rodzicielskiego | do końca roku, w którym dziecko kończy 6 lat |  
| Urlop ojcowski | 14 dni, 1 lub 2 części ≥ 7 dni, do 12 mies. dziecka |  
| Martwe urodzenie / zgon < 8 tyg. | 8 tyg. po porodzie, min. 7 dni od zgonu |  
| Łączenie z pracą | ≤ ½ etatu, wydłużenie proporcjonalne |  
| Wiek dziecka: rodzina zastępcza / adopcja | 7 (10) / 14 lat |  
| Próg płatnika wypłacającego zasiłki | > 20 ubezpieczonych (stan na 30.11) |  


Panel zarządza też: katalogiem intencji (treść pytań, przypisanie do etapów, kolejność), bazą wiedzy RAG (wersjonowane dokumenty), listą organizacji wsparcia, szablonami wniosków i progami eskalacji.  

## 7. Integracja przez MCP  

LLM nie ma bezpośredniego dostępu do baz: widzi wyłącznie narzędzia MCP (zestaw reguł do czego LLM może sięgnąć w źródle. Powinien dostarczać niezbędne dane o użytkowniku (itp..), zeby na ich podstawie odpowiadał zgodnie z prawdą i faktami, a nie halucynował wokół wymyślonych treści.), a każde wywołanie jest ograniczone do danych zalogowanego użytkownika (token sesji z symulowanego mObywatela) lub dane pochodzące z formularza uzupełnionego przez użytkownika nie zalogowanego. Na hackathon wszystkie serwery to mocki z danymi z przykładowych spraw ZUS; w produkcji podmienia się implementację, nie interfejs.  

| Serwer MCP | Narzędzia | Zwraca | Kiedy używany |  
| --- | --- | --- | --- |  
| \`zus-ubezpieczenia\` | \`get_insurance_periods\`, \`get_contribution_base\`, \`get_payer_info\` | tytuły, okresy podlegania, podstawa składek, liczba ubezpieczonych u płatnika | każdy werdykt A, kalkulacje B |  
| \`zus-ezla\` | \`list_sick_leaves\` | e-ZLA z kodami (w tym „B”) i okresami | zasiłek chorobowy, 270 dni |  
| \`zus-naleznosci\` | \`get_debt_status(date)\`, \`issue_debt_certificate\` | zadłużenie na dzień powstania prawa | JDG, kategoria H |  
| \`zus-pue\` | \`get_case_status\`, \`send_question\`, \`book_contact\` | status spraw, wiadomość do ZUS, umówienie e-wizyty | G, eskalacja |  
| \`kalkulator\` | \`check_eligibility\`, \`calc_maternity\`, \`calc_parental_split\`, \`calc_part_time\`, \`calc_adoption\`, \`calc_sickness\` | wynik w formacie z §5.1 | B, C, D, E, F |  
| \`dokumenty\` | \`parse_document\`, \`fill_form(ZAM\\|ZAS-53\\|wniosek_urlopowy)\`, \`submit_to(employer\\|zus)\` | pola z dokumentu, wypełniony PDF, potwierdzenie (symulacja) | upload spraw testowych, G |  
| \`usc\` | \`request_birth_certificate(full\\|short)\` | potwierdzenie złożenia wniosku (symulacja) | E3 |  
| \`wiedza\` | \`search_law\`, \`search_guides\`, \`list_support_orgs(situation)\` | fragmenty przepisów i poradnika z linkiem, organizacje charytatywne | uzasadnienia, F, E6 |  
| \`profil\` | \`get_profile\`, \`update_profile\`, \`get_partner_profile\` | etap, PDP, liczba dzieci, dane drugiego rodzica (za zgodą) | każda rozmowa |  

**Zasady wywołań**  

- Odczyt bez pytania o zgodę (użytkownik zalogował się i zaakceptował zakres na starcie) lub wpisal je w formularzu.  
- Dane drugiego rodzica tylko po jego własnej zgodzie w aplikacji; inaczej użytkownik wpisuje je ręcznie i odpowiedź oznacza je jako „deklarowane”.  
- Każde wywołanie trafia do logu audytowego (kto, kiedy, jakie narzędzie, jaki wynik) widocznego w panelu.  

## 8. Eskalacja i powiadomienia proaktywne  

LLM może przed skontaktowaniem z urzędnikiem zapytać użytkownika, czy chce, aby streszczenie ich komunikacji trafiło jako wiadomość do urzędnika. Dzięki temu kontakt z ZUS nie wymagałby niepotrzebnego przetwarzania/powtarzania historii danego problemu użytkownika.  

### 8.1 Kiedy asystent proponuje kontakt z urzędnikiem  

- użytkownik sam o to poprosi (przycisk zawsze widoczny);  
- dwa kolejne werdykty POTRZEBNE INFO, których nie da się uzupełnić danymi z ZUS ani od użytkownika;  
- niska pewność rozpoznania intencji albo pytanie poza katalogiem bez źródła w bazie wiedzy;  
- sprzeczność danych (np. Z-3 vs okresy ubezpieczenia w ZUS);  
- sytuacje sporne: kwestionowanie umowy lub podstawy, odmowa wypłaty, odwołanie od decyzji;  
- sytuacja trudna (E6), jeśli użytkownik wybierze rozmowę z człowiekiem.  

### 8.2 Kanały (symulowane)  

1. Wiadomość przez PUE/eZUS z automatycznym streszczeniem.  
2. Umówienie e-wizyty lub oddzwonienia z COT.  
3. Wizyta w placówce – z listą dokumentów do zabrania.  

**Paczka eskalacyjna** (generuje LLM, użytkownik akceptuje przed wysłaniem): pytanie własnymi słowami, profil i etap, wyniki silnika, lista brakujących lub sprzecznych danych, załączone dokumenty.  

## 9. Bezpieczeństwo, RODO i ton  

Asystent przetwarza dane o zdrowiu (ciąża, e-ZLA, martwe urodzenie), czyli dane szczególnej kategorii – dlatego minimalizacja danych i kontrola modelu są częścią projektu, a nie dodatkiem.  

### 9.1 Dane i prywatność  

- Model LLM hostowany w infrastrukturze ZUS lub u dostawcy w EOG, bez trenowania na danych użytkowników.  
- Do promptu trafiają tylko pola potrzebne do danej intencji; PESEL, adresy i dane dziecka są pseudonimizowane.  
- Historia rozmowy przechowywana przez okres ustalony w panelu, z możliwością usunięcia przez użytkownika.  
- Dane drugiego rodzica wyłącznie za jego zgodą (§7).  
- Wyraźne oznaczenie, które funkcje działają z AI (wymóg formalny wyzwania i AI Act).  

### 9.2 Guardrails  

- Temat ograniczony do świadczeń związanych z ciążą i rodzicielstwem; inne pytania → grzeczne odesłanie do zus.pl.  
- Walidator liczb (§6) i obowiązkowe źródło dla każdego twierdzenia prawnego.  
- Brak porad medycznych; pytania o zdrowie → lekarz prowadzący.  
- Brak porad, jak „optymalizować” uprawnienia w sposób ryzykowny (umowa dla pozoru, sztuczne podwyższenie podstawy) – zamiast tego informacja o ryzyku.  
- Odporność na prompt injection z wgrywanych dokumentów: treść PDF jest danymi, nie poleceniem.  

### 9.3 Ton komunikacji  

| Sytuacja | Ton | Czego unikać |  
| --- | --- | --- |  
| Standardowa | prosty język, zwracanie się po imieniu lub „Pani/Pan” wg wyboru, krótkie zdania | żargonu („płatnik składek” → „pracodawca/zleceniodawca” z dopiskiem) |  
| Werdykt NIE | rzeczowo i z alternatywą | brzmienia oskarżycielskiego |  
| Ryzyko (H) | ostrzegawczo, z konkretnym krokiem zapobiegawczym | straszenia |  
| Sytuacja trudna (E6) | ciepło, wolniej, bez liczników i grafik „szczęśliwego rodzicielstwa”; na początku kondolencje i pytanie, czy teraz jest dobry moment | entuzjastycznych zwrotów, przypomnień o terminach bez zgody |  

W ścieżce E6 asystent najpierw pokazuje, że nie trzeba nic załatwiać natychmiast, potem minimalny zestaw kroków i dokumentów, a na końcu – organizacje wsparcia (pobierane z panelu, z kategorią: żałoba, wcześniaki, poronienie, ciężka choroba dziecka).  

## 10. Testy, MVP na hackathon i użycie AI  

### 10.1 Scenariusze testowe (z zestawów ZUS)  

| # | Scenariusz | Oczekiwany wynik |  
| --- | --- | --- |  
| T1 | Pracownica, płatnik > 20, jedno dziecko, wniosek 81,5% w terminie | TAK, wypłaca pracodawca, kwota zgodna z Z-3 |  
| T2 | Zleceniobiorczyni, dobrowolne chorobowe < 90 dni przed e-ZLA | chorobowy: NIE (okres wyczekiwania), macierzyński: TAK jeśli ubezpieczona w dniu porodu |  
| T3 | JDG z zadłużeniem na dzień powstania prawa | POTRZEBNE INFO / ostrzeżenie o zadłużeniu |  
| T4 | Umowa zlecenia zakończona przed porodem | NIE + wyjaśnienie przyczyny |  
| T5 | Rozwiązanie umowy w ciąży z powodu likwidacji pracodawcy | TAK: zasiłek w wysokości zasiłku macierzyńskiego do porodu |  
| T6 | Bliźnięta + „Za życiem” | wymiar z tabeli załącznika |  
| T7 | Martwe urodzenie | 8 tygodni, ścieżka E6, organizacje wsparcia |  
| T8 | Ojciec przejmuje urlop po hospitalizacji matki | TAK, okres odpowiadający hospitalizacji |  
| T9 | Rodzic na rodzicielskim + praca ½ etatu | wydłużony okres i proporcjonalny zasiłek |  
| T10 | Adopcja dziecka 9-letniego | TAK (≤ 14 lat), urlop na warunkach macierzyńskiego |  
| T11 | Pytanie spoza katalogu bez źródła | brak zmyślonej odpowiedzi, propozycja eskalacji |  
| T12 | Dokument z wstrzykniętym poleceniem | polecenie zignorowane |  

### 10.2 Kryteria akceptacji  

- \[ \] 100% zgodności kwot i okresów z rozstrzygnięciami w zestawach ZUS (testy automatyczne).  
- \[ \] Każda odpowiedź ma werdykt, uzasadnienie i podstawę prawną z linkiem.  
- \[ \] Brak liczb w treści LLM, których nie zwrócił silnik.  
- \[ \] Czas odpowiedzi z listy < 1 s, z LLM < 5 s.  
- \[ \] Interfejs w pełni responsywny, dostępność WCAG 2.1 AA.  
- \[ \] Zmiana parametru w panelu zmienia wynik bez wdrożenia kodu.  

### 10.3 Zakres MVP  

1. Symulowane logowanie mObywatelem i pobranie profilu z mocków MCP, symulowanie danych pobranych z formularza.  
2. Wybór etapu + lista pytań A, B, C, G z kartami odpowiedzi.  
3. Zintegrowany kalkulator (macierzyński, podział rodziców, praca ≤ ½ etatu, adopcja).  
4. Opcja „INNE”: LLM z RAG na wyciągu przepisów i poradniku ZUS 2026.  
5. Eskalacja z paczką streszczenia (symulacja PUE).  
6. Panel administracyjny z parametrami z §6.1.  

### 10.4 Wskazanie funkcji opartych na AI (do opisu projektu)  

| Funkcja | AI? | Uwagi |  
| --- | --- | --- |  
| Lista pytań per etap | nie | reguły + katalog w panelu |  
| Werdykty i kalkulatory | nie | deterministyczny silnik |  
| Rozpoznanie pytania w wolnym tekście (INNE) | tak | LLM, klasyfikacja intencji |  
| Wyjaśnienie wyniku prostym językiem | tak | LLM, liczby z silnika |  
| Odpowiedzi spoza katalogu | tak | LLM + RAG + MCP |  
| Streszczenie do eskalacji | tak | LLM, akceptacja użytkownika |  
| Powiadomienia proaktywne | nie | wyzwalacze regułowe |
