import type { Article } from '@/domain/knowledge/Article';

/** Rozdział „Po narodzinach i przyjęciu dziecka” — wygenerowane z prototypu (js/wiedza.js), treść: Poradnik ZUS. */
export const AFTER_BIRTH_ARTICLES: readonly Article[] = [
  {
    id: 'mac-podstawy',
    chapterId: 'po',
    title: 'Zasiłek macierzyński — podstawowe informacje',
    lead: 'Zasiłek macierzyński to grupa wypłat za różne urlopy związane z rodzicielstwem.',
    source: 'Poradnik, s. 29',
    body: [
      {
        type: 'paragraph',
        text: 'Prawo powstaje z dniem **urodzenia** dziecka albo **przyjęcia go na wychowanie**. Kluczowy warunek: w tym dniu musicie podlegać ubezpieczeniu chorobowemu — obowiązkowo (np. pracownicy) albo dobrowolnie (przedsiębiorcy, zleceniobiorcy).',
      },
      {
        type: 'paragraph',
        text: 'Pracownikom przysługuje zasiłek za okres udzielonego urlopu, pozostałym ubezpieczonym — za okres odpowiadający urlopowi, na tych samych zasadach co do wymiaru i wysokości. Zasiłek wypłaca płatnik albo ZUS (jak przy zasiłku chorobowym), przedsiębiorcom zawsze ZUS.',
      },
    ],
    links: ['macUrodzenie', 'macOkres'],
    calculator: 'birth',
  },
  {
    id: 'urlop-mac',
    chapterId: 'po',
    title: 'Za okres urlopu macierzyńskiego',
    lead: 'Urlop macierzyński trwa 20 tygodni przy jednym dziecku.',
    source: 'Poradnik, s. 29–30',
    body: [
      {
        type: 'table',
        header: ['Liczba dzieci przy porodzie', 'Wymiar'],
        rows: [
          ['1', '20 tygodni'],
          ['2', '31 tygodni'],
          ['3', '33 tygodnie'],
          ['4', '35 tygodni'],
          ['5 i więcej', '37 tygodni'],
        ],
      },
      {
        type: 'list',
        ordered: false,
        items: [
          'Pierwsze **14 tygodni** przysługuje wyłącznie mamie.',
          'Pozostałą część może przejąć tata, jeśli mama wróci do pracy.',
        ],
      },
      {
        type: 'important',
        text: 'Rezygnację z części urlopu mama składa najpóźniej 7 dni przed powrotem do pracy, a tata wniosek o tę część — 14 dni przed jej rozpoczęciem. ZUS sprawdza, czy tata ma ubezpieczenie chorobowe.',
      },
    ],
    links: ['macOkres'],
    calculator: 'birth',
  },
  {
    id: 'na-warunkach',
    chapterId: 'po',
    title: 'Adopcja i rodzina zastępcza',
    lead: 'Urlop na warunkach urlopu macierzyńskiego przysługuje, gdy przyjmujecie dziecko na wychowanie.',
    source: 'Poradnik, s. 30; art. 183 KP',
    body: [
      {
        type: 'list',
        ordered: false,
        items: [
          'Przy wniosku do sądu o przysposobienie — dziecko do **14 lat**.',
          'Przy rodzinie zastępczej niezawodowej — dziecko do **7 lat** (10 przy odroczeniu obowiązku szkolnego). Nie dotyczy zawodowej rodziny zastępczej.',
          'Wymiar jak przy urodzeniu (20–37 tygodni), ale nie krócej niż **9 tygodni**; potem urlop rodzicielski.',
          'Wniosek do pracodawcy w ciągu 7 dni od przyjęcia dziecka; urlop zaczyna się najpóźniej 21 dni od przyjęcia.',
        ],
      },
    ],
    links: ['macOkres'],
    calculator: 'adopt',
    wizard: 'w-adopcja',
  },
  {
    id: 'uzupelniajacy',
    chapterId: 'po',
    title: 'Uzupełniający urlop macierzyński',
    lead: 'Dodatkowy urlop dla rodziców wcześniaków i dzieci, które po porodzie leżą w szpitalu — płatny 100%.',
    source: 'Poradnik, s. 30–31',
    body: [
      {
        type: 'paragraph',
        text: 'Tydzień urlopu za każdy tydzień pobytu dziecka w szpitalu (niepełny tydzień zaokrągla się w górę):',
      },
      {
        type: 'list',
        ordered: false,
        items: [
          '**do 15 tygodni** — poród przed 28. tygodniem ciąży lub masa urodzeniowa do 1000 g,',
          '**do 8 tygodni** — poród po 28. tygodniu,',
          '**do 8 tygodni** — poród po 37. tygodniu, gdy pobyt w szpitalu trwa co najmniej 2 kolejne dni i zaczyna się między 5. a 28. dniem po porodzie.',
        ],
      },
      {
        type: 'important',
        text: 'Wykorzystuje go mama lub tata, bezpośrednio po urlopie macierzyńskim, jednorazowo. Wniosek najpóźniej 21 dni przed końcem urlopu macierzyńskiego — z zaświadczeniem ze szpitala i oświadczeniem drugiego rodzica.',
      },
    ],
    links: ['wczesniaki'],
    calculator: 'birth',
    wizard: 'w-uzupelniajacy',
  },
  {
    id: 'rodzicielski',
    chapterId: 'po',
    title: 'Za okres urlopu rodzicielskiego',
    lead: 'Urlop rodzicielski trwa 41 tygodni (43 przy więcej niż jednym dziecku).',
    source: 'Poradnik, s. 31–32',
    body: [
      {
        type: 'list',
        ordered: false,
        items: [
          'Każde z rodziców ma **9 tygodni** wyłącznie dla siebie — nie można ich przenieść.',
          'Możecie korzystać jednocześnie lub naprzemiennie.',
          'Maksymalnie **5 części**, do końca roku kalendarzowego, w którym dziecko kończy 6 lat.',
          'Wniosek do pracodawcy najpóźniej 21 dni przed rozpoczęciem części urlopu.',
          'Urlop można łączyć z pracą do połowy etatu — urlop się wydłuża, zasiłek maleje proporcjonalnie.',
        ],
      },
    ],
    links: ['macRodz', 'mrpips'],
    calculator: 'birth',
    wizard: 'w-rodzicielski',
  },
  {
    id: 'za-zyciem',
    chapterId: 'po',
    title: 'Dziecko z zaświadczeniem „Za życiem”',
    lead: 'Rodzice dziecka z zaświadczeniem „Za życiem” mają dłuższy urlop rodzicielski.',
    source: 'Poradnik, s. 32',
    body: [
      {
        type: 'list',
        ordered: false,
        items: [
          '65 tygodni — gdy urodziło się jedno dziecko,',
          '67 tygodni — gdy urodziło się co najmniej dwoje,',
          '62 tygodnie — przy przyjęciu dziecka (rodzina zastępcza do 7/10 lat, przysposobienie do 14 lat).',
        ],
      },
      {
        type: 'paragraph',
        text: 'Każdemu z rodziców nadal przysługuje 9 nieprzenoszalnych tygodni. Przy łączeniu urlopu z pracą zasiłek może trwać do 130 tygodni (134 przy więcej dzieciach).',
      },
    ],
    links: ['macRodz'],
  },
  {
    id: 'ojcowski',
    chapterId: 'po',
    title: 'Za okres urlopu ojcowskiego',
    lead: 'Urlop ojcowski to wyłączne prawo taty — 2 tygodnie, płatne 100%.',
    source: 'Poradnik, s. 32–33',
    body: [
      {
        type: 'list',
        ordered: false,
        items: [
          'Jednorazowo albo w dwóch częściach po 7 dni.',
          'Do ukończenia przez dziecko 12 miesięcy (przy adopcji — 12 miesięcy od uprawomocnienia przysposobienia, nie dłużej niż do 14 lat).',
          'Przysługuje także wtedy, gdy mama nie jest ubezpieczona. Liczba dzieci nie wydłuża urlopu.',
          'Wniosek do pracodawcy najpóźniej 7 dni przed.',
        ],
      },
      {
        type: 'important',
        text: 'Jeśli tata nie zdąży przed pierwszymi urodzinami dziecka, prawo do urlopu wygasa.',
      },
    ],
    links: ['macOjc', 'tata'],
    calculator: 'birth',
    wizard: 'w-ojcowski',
  },
  {
    id: 'tata',
    chapterId: 'po',
    title: 'Zasiłek macierzyński dla taty',
    lead: 'Tata może pobierać zasiłek za część urlopu macierzyńskiego i za urlop rodzicielski.',
    source: 'Opis wyzwania ZUS (pkt B); art. 180 KP',
    body: [
      {
        type: 'list',
        ordered: false,
        items: [
          '**Przejęcie po 14 tygodniach:** mama rezygnuje z dalszej części, a tata ją wykorzystuje bezpośrednio po niej.',
          '**Wcześniej niż po 14 tygodniach** — gdy mama ma orzeczenie o niezdolności do samodzielnej egzystencji, przebywa w szpitalu (po wykorzystaniu 8 tygodni), zmarła albo porzuciła dziecko.',
          '**Urlop rodzicielski:** tata ma 9 tygodni dla siebie i może korzystać z części mamy. Zasiłek za rodzicielski przysługuje mu także wtedy, gdy mama w dniu porodu nie była ubezpieczona.',
        ],
      },
    ],
    links: ['tata', 'macOjc'],
    wizard: 'w-przejecie',
  },
  {
    id: 'wysokosc-mac',
    chapterId: 'po',
    title: 'Wysokość zasiłku macierzyńskiego',
    lead: 'Za urlop macierzyński 100%, za rodzicielski 70% — albo 81,5% przez cały okres.',
    source: 'Poradnik, s. 33–34; art. 31 ustawy zasiłkowej',
    body: [
      {
        type: 'table',
        header: ['Okres', 'Wysokość'],
        rows: [
          [
            'Macierzyński (także przed porodem), na warunkach macierzyńskiego, uzupełniający, ojcowski, martwe urodzenie',
            '100%',
          ],
          ['Rodzicielski', '70%'],
          [
            'Wariant uśredniony: macierzyński + rodzicielski przy wniosku do 21 dni po porodzie',
            '81,5%',
          ],
          ['9 tygodni drugiego rodzica', 'zawsze 70%'],
        ],
      },
      {
        type: 'paragraph',
        text: '**Wariant uśredniony** wymaga złożenia przez mamę w ciągu 21 dni po porodzie wniosku o zasiłek za urlop macierzyński i jej część rodzicielskiego (32 lub 34 tygodnie) albo deklaracji, że z niego skorzysta. Bez wniosku obowiązuje wariant zmienny: 100%, potem 70%.',
      },
      {
        type: 'important',
        text: 'Zasiłek po odjęciu zaliczki PIT nie może być niższy niż świadczenie rodzicielskie (1000 zł). Jeśli w 1. roku życia dziecka nie wykorzystacie ani dnia rodzicielskiego, zasiłek za rodzicielski wyniesie 70%, a za macierzyński należy się wyrównanie do 100% (na wniosek).',
      },
      {
        type: 'example',
        text: 'Podstawa 6040,30 zł (7000 zł brutto). Wariant zmienny: 6040,30 zł przez 20 tygodni, potem 4228,21 zł. Wariant uśredniony: 4922,84 zł brutto miesięcznie przez cały rok.',
      },
    ],
    links: ['macWys'],
    calculator: 'birth',
  },
  {
    id: 'jak-mac',
    chapterId: 'po',
    title: 'Jak otrzymać zasiłek macierzyński',
    lead: 'Gdzie złożyć dokumenty, zależy od tego, kto wypłaca zasiłek.',
    source: 'Poradnik, s. 34–35; opis wyzwania ZUS',
    body: [
      {
        type: 'table',
        header: ['Sytuacja', 'Gdzie i co'],
        rows: [
          [
            'Pracownica, duży płatnik (21+ osób)',
            'Wniosek o urlop u pracodawcy + odpis aktu urodzenia do wglądu. Pracodawca wypłaca zasiłek.',
          ],
          [
            'Pracownica, mały płatnik (do 20 osób)',
            'Wniosek u pracodawcy — przekazuje go do ZUS z zaświadczeniem Z-3. Wypłaca ZUS.',
          ],
          [
            'Zleceniobiorczyni',
            'Wniosek ZAM u zleceniodawcy; mały płatnik przekazuje go do ZUS z Z-3a.',
          ],
          ['Przedsiębiorczyni', 'Wniosek ZAM bezpośrednio do ZUS (eZUS).'],
        ],
      },
      {
        type: 'important',
        text: 'Od 24.10.2026 formularz ZAM obejmuje też urlop rodzicielski i ojcowski (dawne ZUR i ZAO), a zaświadczenie Z-3b zlikwidowano. ZUS może sam pobrać odpis aktu urodzenia z rejestru stanu cywilnego.',
      },
    ],
    links: ['macUrodzenie', 'formularze', 'usc'],
    calculator: 'birth',
    wizard: 'w-81',
  },
  {
    id: 'wazne-mac',
    chapterId: 'po',
    title: 'Ważne informacje uzupełniające',
    lead: 'O tym często się zapomina.',
    source: 'Poradnik, s. 35',
    body: [
      {
        type: 'list',
        ordered: false,
        items: [
          'Zasiłek macierzyński nie przysługuje za czas urlopu wychowawczego.',
          'Osoba z dobrowolnym chorobowym jest z niego automatycznie wyrejestrowana, gdy zaczyna pobierać zasiłek macierzyński — po zasiłku musi zgłosić się ponownie.',
          'Jeśli z powodu sytuacji zawodowej nie macie prawa do zasiłku macierzyńskiego (np. osoby bezrobotne, studenci, umowa o dzieło), przysługuje **świadczenie rodzicielskie** — wniosek w gminie.',
          'Roszczenie o zasiłek przedawnia się po 6 miesiącach.',
        ],
      },
    ],
    links: ['rodzice'],
  },
];
