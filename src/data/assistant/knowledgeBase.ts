import type { KnowledgeEntry } from '@/domain/assistant/KnowledgeEntry';

/**
 * Baza wiedzy Asystenta — wygenerowane z prototypu (js/kb.js). Każda odpowiedź ma źródło (Poradnik ZUS
 * dla rodziców, stan prawny 1.04.2026; KP; ustawa zasiłkowa). Słowa kluczowe bez polskich znaków;
 * „=fraza” — tylko dokładne dopasowanie słów. Linki do kreatorów wniosków pominięte (Faza 7).
 */
export const KNOWLEDGE_BASE: readonly KnowledgeEntry[] = [
  {
    id: 'hello',
    question: 'Co potrafisz?',
    keywords: ['czesc', 'hej', 'dzien dobry', 'witam', 'co umiesz', 'co potrafisz', 'pomocy', 'kim jestes'],
    answer: [
      {
        type: 'paragraph',
        text: 'Jestem asystentem mZUS dla Rodzica. Odpowiadam na pytania o świadczenia z ZUS dla rodziców — na podstawie Poradnika ZUS dla rodziców i opiekunów dzieci: ubezpieczenie chorobowe, L4 w ciąży, zasiłek macierzyński za wszystkie urlopy, zasiłek opiekuńczy, zasiłek pogrzebowy i trudne sytuacje.',
      },
      {
        type: 'paragraph',
        text: 'Nie wydaję decyzji — rozstrzyga ZUS. Przy każdej odpowiedzi podaję źródło.',
      },
    ],
    source: 'mZUS dla Rodzica',
    actions: [
      {
        label: 'Zakładka Wiedza',
        href: '/wiedza',
      },
    ],
  },
  {
    id: 'l4-b',
    question: 'Ile dostanę na L4 w ciąży?',
    keywords: [
      'l4 w ciazy',
      'zwolnienie w ciazy',
      'chorobowe w ciazy',
      'kod b',
      'l4 ciaza',
      'zasilek chorobowy ciaza',
      '270 dni',
      'ile na l4',
    ],
    answer: [
      {
        type: 'paragraph',
        text: 'Zwolnienie z **kodem B** (niezdolność do pracy w ciąży) daje **100% podstawy** od pierwszego dnia. Okres zasiłkowy w ciąży to **270 dni** (zamiast 182).',
      },
      {
        type: 'list',
        ordered: false,
        items: [
          'Pracownica: pierwsze 33 dni w roku (14 dni po 50. r.ż.) płaci pracodawca jako wynagrodzenie chorobowe, potem zasiłek.',
          'Podstawa = średnia z 12 miesięcy brutto minus 13,71% składek; od zasiłku potrąca się zaliczkę PIT.',
        ],
      },
      {
        type: 'paragraph',
        text: 'Sama ciąża nie jest podstawą do L4 — lekarz wystawia je z powodu choroby w okresie ciąży.',
      },
    ],
    source: 'Poradnik, s. 23–25',
    actions: [
      {
        label: 'Karta: L4 w ciąży',
        href: '/wiedza/artykul/l4-ciaza',
      },
    ],
  },
  {
    id: 'l4-kody',
    question: 'Co oznacza kod 1 i kod 2 na zwolnieniu?',
    keywords: ['kod 1', 'kod 2', 'lezec', 'chodzic', 'wskazanie lekarskie', 'moge wyjsc', 'wyjsc z domu'],
    answer: [
      {
        type: 'paragraph',
        text: 'To wskazania lekarskie na e-ZLA:',
      },
      {
        type: 'list',
        ordered: false,
        items: ['**1** — powinnaś leżeć,', '**2** — możesz chodzić.'],
      },
      {
        type: 'paragraph',
        text: 'Zwykłe czynności dnia codziennego (zakupy, apteka, wizyta lekarska, krótki spacer, odprowadzenie dziecka do przedszkola) nie są naruszeniem zwolnienia.',
      },
    ],
    source: 'Poradnik, s. 26',
    actions: [],
  },
  {
    id: 'l4-praca',
    question: 'Czy na L4 mogę odpisać na maila albo wystawić fakturę?',
    keywords: [
      'faktur',
      'mail',
      'pracowac na l4',
      'praca na zwolnieniu',
      'incydent',
      'kontrola zwolnien',
      'kontrola l4',
      'zbieg',
      'etat i firma',
      'uop i jdg',
    ],
    answer: [
      {
        type: 'paragraph',
        text: '**Tak, jeśli to czynność incydentalna.** Poradnik ZUS wymienia jako dozwolone np. odpowiedź na maila i **podpisanie faktury** oraz załatwienie pilnej sprawy urzędowej.',
      },
      {
        type: 'paragraph',
        text: 'Zakazana jest **praca zarobkowa** i aktywność utrudniająca leczenie. Grozi za to utrata zasiłku za cały okres zwolnienia i zwrot z odsetkami.',
      },
      {
        type: 'list',
        ordered: false,
        items: [
          'Od 13.04.2026 obowiązują nowe definicje i uprawnienia kontrolerów.',
          'Od 1.01.2027 lekarz będzie mógł wystawić L4 tylko z jednego tytułu, jeśli w drugim praca jest możliwa (na Twoje żądanie).',
        ],
      },
    ],
    source: 'Poradnik, s. 26–27; Dz.U. 2026 poz. 26',
    actions: [],
  },
  {
    id: 'l4-kto',
    question: 'Kto płaci za moje zwolnienie — pracodawca czy ZUS?',
    keywords: [
      'kto placi',
      'kto wyplaca',
      '33 dni',
      'wynagrodzenie chorobowe',
      'maly platnik',
      'duzy platnik',
      '20 osob',
      '21 osob',
    ],
    answer: [
      {
        type: 'paragraph',
        text: 'Zależy od liczby osób, które Twój pracodawca zgłosił do chorobowego **na 30 listopada poprzedniego roku**:',
      },
      {
        type: 'list',
        ordered: false,
        items: [
          '**21 i więcej** — zasiłki wypłaca pracodawca,',
          '**do 20** — wypłaca ZUS (pracodawca przekazuje wniosek).',
        ],
      },
      {
        type: 'paragraph',
        text: 'Przedsiębiorcy zawsze wypłaca ZUS. Nie musisz tego sprawdzać sama — w aplikacji pokazujemy to na podstawie danych z eZUS.',
      },
    ],
    source: 'Poradnik, s. 23',
    actions: [],
  },
  {
    id: 'l4-jdg',
    question: 'Mam firmę — czy dostanę zasiłek chorobowy w ciąży?',
    keywords: [
      'jdg l4',
      'firma l4',
      'dzialalnosc l4',
      'przedsiebiorczyni l4',
      'chorobowe dobrowolne',
      'okres wyczekiwania',
      '90 dni',
    ],
    answer: [
      {
        type: 'paragraph',
        text: 'Tak, jeśli opłacasz **dobrowolne ubezpieczenie chorobowe**. Przy dobrowolnym ubezpieczeniu prawo do zasiłku chorobowego pojawia się po **90 dniach** ubezpieczenia (przy obowiązkowym — po 30 dniach). Zasiłek należy się od pierwszego dnia zwolnienia.',
      },
      {
        type: 'list',
        ordered: false,
        items: [
          'Składasz do ZUS wniosek o zasiłek chorobowy **ZAS-53** (eZUS). Zaświadczenie Z-3b zlikwidowano od 24.10.2026.',
          'Uwaga: zaległość w składkach powyżej 1% płacy minimalnej (48,06 zł) blokuje wypłatę do czasu spłaty.',
        ],
      },
    ],
    source: 'UZ art. 2a i 4; opis wyzwania ZUS (HackNation 2026)',
    actions: [],
  },
  {
    id: 'mac-wymiar',
    question: 'Ile trwa urlop macierzyński?',
    keywords: [
      'ile trwa macierzynski',
      'urlop macierzynski',
      'dlugosc urlopu',
      'ile tygodni',
      '20 tygodni',
      'macierzynski ile',
    ],
    answer: [
      {
        type: 'paragraph',
        text: 'Urlop macierzyński trwa:',
      },
      {
        type: 'list',
        ordered: false,
        items: [
          '**20 tygodni** — 1 dziecko,',
          '31 — bliźnięta, 33 — trojaczki, 35 — czworaczki, 37 — pięcioro i więcej.',
        ],
      },
      {
        type: 'paragraph',
        text: 'Pierwsze **14 tygodni** przysługuje wyłącznie mamie. Potem jest urlop rodzicielski (41 lub 43 tygodnie) dla obojga rodziców.',
      },
    ],
    source: 'art. 180 KP; Poradnik, s. 29–30',
    actions: [
      {
        label: 'Kalkulator zasiłku',
        href: '/kalkulator',
      },
    ],
  },
  {
    id: 'mac-przed',
    question: 'Czy mogę zacząć macierzyński przed porodem?',
    keywords: ['przed porodem', 'wczesniej na macierzynski', '6 tygodni przed', 'przed terminem'],
    answer: [
      {
        type: 'paragraph',
        text: 'Tak — maksymalnie **6 tygodni** przed przewidywaną datą porodu. Te tygodnie wliczają się do 20 tygodni urlopu.',
      },
      {
        type: 'list',
        ordered: false,
        items: [
          'Wniosek do pracodawcy najpóźniej **14 dni** przed rozpoczęciem.',
          'Dołącz zaświadczenie lekarskie o przewidywanej dacie porodu.',
          'Zasiłek wynosi 100% podstawy.',
        ],
      },
    ],
    source: 'art. 180 § 2 KP; Poradnik, s. 27–28',
    actions: [],
  },
  {
    id: 'mac-81',
    question: 'Co lepiej wybrać: 81,5% czy 100% + 70%?',
    keywords: ['81', '815', '81 5', 'wariant', 'co lepiej', 'oplaca sie', 'usredniony', '100 i 70', 'ktory wariant'],
    answer: [
      {
        type: 'paragraph',
        text: 'Przy **pełnym** wykorzystaniu urlopu suma obu wariantów jest prawie taka sama (dla 1 dziecka: 0,815 × 52 tyg. ≈ 20 + 0,7 × 32 tyg.).',
      },
      {
        type: 'list',
        ordered: false,
        items: [
          '**81,5%** — równe przelewy przez cały rok.',
          '**100% + 70%** — więcej na początku. Zwykle korzystniejsze, jeśli wrócisz do pracy przed końcem rodzicielskiego.',
        ],
      },
      {
        type: 'paragraph',
        text: 'Warunek 81,5%: co najmniej 1 dzień rodzicielskiego musi przypaść w 1. roku życia dziecka. 9 tygodni drugiego rodzica zawsze płatne jest 70%.',
      },
    ],
    source: 'UZ art. 30a, 31 ust. 3–4; Poradnik, s. 33–34',
    actions: [
      {
        label: 'Porównaj w kalkulatorze',
        href: '/kalkulator',
      },
    ],
  },
  {
    id: 'mac-21',
    question: 'Do kiedy muszę złożyć wniosek o 81,5%?',
    keywords: ['21 dni', 'termin wniosku', 'dlugi wniosek', 'pelny wymiar', 'do kiedy wniosek'],
    answer: [
      {
        type: 'paragraph',
        text: 'Najpóźniej **21 dni po porodzie**. Wniosek dotyczy urlopu macierzyńskiego i Twojej części rodzicielskiego (32 tyg. przy 1 dziecku, 34 przy więcej).',
      },
      {
        type: 'list',
        ordered: false,
        items: ['Pracownica — do pracodawcy.', 'Przedsiębiorczyni — do ZUS.'],
      },
      {
        type: 'paragraph',
        text: 'Jeśli nie złożysz go w terminie, dostaniesz 100% za macierzyński i 70% za rodzicielski. Strażnik terminów pokazuje Ci bezpieczną datę.',
      },
    ],
    source: 'UZ art. 30a ust. 1; Poradnik, s. 34',
    actions: [],
  },
  {
    id: 'mac-ile',
    question: 'Ile wyniesie mój zasiłek macierzyński?',
    keywords: [
      'ile dostane',
      'wysokosc zasilku',
      'kwota zasilku',
      'oblicz zasilek',
      'podstawa wymiaru',
      'na reke',
      'ile pieniedzy',
    ],
    answer: [
      {
        type: 'paragraph',
        text: 'Podstawa to średnie wynagrodzenie brutto z 12 miesięcy pomniejszone o **13,71%** składek. Od niej:',
      },
      {
        type: 'list',
        ordered: false,
        items: ['100% za macierzyński, 70% za rodzicielski,', 'albo 81,5% za całość.'],
      },
      {
        type: 'paragraph',
        text: 'Od zasiłku potrąca się zaliczkę PIT. Składki zdrowotnej się nie płaci, a składki emerytalne i rentowe finansuje budżet państwa. Przy pełnym etacie podstawa nie może być niższa niż 4147,10 zł (2026).',
      },
    ],
    source: 'Poradnik, s. 19–20, 24; załącznik HackNation',
    actions: [
      {
        label: 'Oblicz',
        href: '/kalkulator',
      },
    ],
  },
  {
    id: 'mac-min',
    question: 'Jaki jest najniższy zasiłek macierzyński?',
    keywords: ['minimalny zasilek', 'najmniej', 'najnizszy', '1000 zl', 'niski zasilek', 'podwyzszenie'],
    answer: [
      {
        type: 'paragraph',
        text: 'Jeśli zasiłek macierzyński po odjęciu zaliczki PIT wynosi mniej niż **1000 zł** miesięcznie (kwota świadczenia rodzicielskiego), ZUS lub płatnik **podwyższa go do 1000 zł**. Dopłatę finansuje budżet państwa.',
      },
    ],
    source: 'UZ art. 31 ust. 3a; Poradnik, s. 19',
    actions: [],
  },
  {
    id: 'mac-gdzie',
    question: 'Gdzie złożyć wniosek o zasiłek macierzyński?',
    keywords: [
      'gdzie zlozyc',
      'wniosek o zasilek macierzynski',
      'jak dostac zasilek',
      'jak otrzymac zasilek',
      'odpis aktu',
    ],
    answer: [
      {
        type: 'list',
        ordered: false,
        items: [
          '**Pracownica / pracownik:** wniosek o urlop do pracodawcy (jeden wniosek może objąć macierzyński i rodzicielski) + odpis aktu urodzenia do wglądu. Pracodawca zgłaszający ponad 20 osób wypłaca sam, mniejszy przesyła do ZUS zaświadczenie Z-3.',
          '**Zleceniobiorca:** wniosek **ZAM**; płatnik przekazuje do ZUS Z-3a.',
          '**Przedsiębiorczyni:** wniosek **ZAM** do ZUS przez eZUS.',
        ],
      },
      {
        type: 'paragraph',
        text: 'Od 24.10.2026 ZAM obejmuje też urlop rodzicielski i ojcowski (dawne ZUR i ZAO). ZUS może sam pobrać odpis aktu urodzenia z USC.',
      },
    ],
    source: 'Poradnik, s. 34–35; opis wyzwania ZUS (HackNation 2026)',
    actions: [],
  },
  {
    id: 'jdg-zua',
    question: 'Czy po zasiłku macierzyńskim muszę znowu zgłosić się do chorobowego?',
    keywords: [
      'zua',
      'wyrejestr',
      'ponownie zglosic',
      'po zasilku',
      'po macierzynskim chorobowe',
      'dobrowolne po',
      'po macierzynskim',
      'jako firma',
      'zglosic w zus',
    ],
    answer: [
      {
        type: 'paragraph',
        text: '**Tak — to częsta pułapka.** Gdy przedsiębiorczyni (lub zleceniobiorczyni z dobrowolnym chorobowym) zaczyna pobierać zasiłek macierzyński, jest **automatycznie wyrejestrowana** z dobrowolnego ubezpieczenia chorobowego.',
      },
      {
        type: 'paragraph',
        text: 'Po zakończeniu zasiłku musisz ponownie złożyć **ZUS ZUA**. Inaczej nie będziesz mieć prawa do kolejnych zasiłków (np. L4).',
      },
    ],
    source: 'Poradnik, s. 13 i 35',
    actions: [],
  },
  {
    id: 'jdg-dlug',
    question: 'Mam zaległość w składkach — czy dostanę zasiłek?',
    keywords: [
      'zaleglosc',
      'dlug w zus',
      'zadluzenie',
      'nie zaplacilam skladki',
      'nie zaplacilem',
      'brak wplaty',
      '48',
    ],
    answer: [
      {
        type: 'paragraph',
        text: 'Jeśli prowadzisz firmę (albo z nią współpracujesz), a w dniu powstania prawa do zasiłku masz zaległość w składkach **większą niż 1% płacy minimalnej (48,06 zł w 2026)**, zasiłek nie jest wypłacany **do czasu spłaty całości**.',
      },
      {
        type: 'paragraph',
        text: 'Jeśli nie spłacisz w ciągu **6 miesięcy**, prawo do zasiłku przepada. Sprawdź saldo w eZUS i spłać zaległość jak najszybciej.',
      },
    ],
    source: 'UZ art. 2a; Poradnik, s. 24',
    actions: [],
  },
  {
    id: 'ulga',
    question: 'Mam ulgę na start — czy dostanę macierzyński?',
    keywords: ['ulga na start', 'ulga start', 'mam ulge'],
    answer: [
      {
        type: 'paragraph',
        text: 'Na uldze na start **nie podlegasz ubezpieczeniom społecznym**, także chorobowemu. Zasiłek macierzyński nie przysługuje.',
      },
      {
        type: 'paragraph',
        text: 'Możesz dostać **świadczenie rodzicielskie** — 1000 zł miesięcznie z gminy (MOPS), wniosek w ciągu 3 miesięcy od urodzenia. Z ulgi możesz zrezygnować wcześniej i zgłosić się do ubezpieczeń, ale chorobowe nie działa wstecz.',
      },
    ],
    source: 'Poradnik, s. 14–15 i 35',
    actions: [
      {
        label: 'Świadczenie rodzicielskie',
        href: '/wiedza/artykul/wazne-mac',
      },
    ],
  },
  {
    id: 'zlecenie',
    question: 'Pracuję na umowie zlecenia — czy dostanę macierzyński?',
    keywords: ['zlecenie', 'umowa zlecenia', 'zleceniobiorca', 'umowa o dzielo', 'dzielo'],
    answer: [
      {
        type: 'paragraph',
        text: 'Tylko jeśli w dniu porodu podlegasz **dobrowolnemu ubezpieczeniu chorobowemu** z umowy zlecenia. Nie da się zgłosić wstecz.',
      },
      {
        type: 'list',
        ordered: false,
        items: [
          'Jeśli równolegle masz etat z pensją co najmniej minimalną, ze zlecenia nie możesz mieć chorobowego.',
          'Umowa o dzieło nie daje prawa do zasiłku — wtedy przysługuje świadczenie rodzicielskie (1000 zł).',
        ],
      },
    ],
    source: 'Poradnik, s. 9–10 i 35',
    actions: [],
  },
  {
    id: 'brak',
    question: 'Nie pracuję albo studiuję — co mi przysługuje?',
    keywords: [
      '=nie pracuje',
      '=nie pracuje i',
      'studentka',
      'student',
      'bezrobotna',
      'bezrobotny',
      'bez ubezpieczenia',
      'kosiniakowe',
      'swiadczenie rodzicielskie',
    ],
    answer: [
      {
        type: 'paragraph',
        text: '**Świadczenie rodzicielskie** („kosiniakowe”): **1000 zł miesięcznie** przez 52 tygodnie (dłużej przy ciąży mnogiej), wolne od podatku.',
      },
      {
        type: 'list',
        ordered: false,
        items: [
          'Wniosek w gminie / MOPS lub przez gov.pl (Emp@tia).',
          'Złożony w ciągu 3 miesięcy od urodzenia — świadczenie od dnia urodzenia.',
        ],
      },
      {
        type: 'paragraph',
        text: 'To świadczenie wypłaca gmina, nie ZUS. Zasiłek macierzyński z ZUS wymaga ubezpieczenia chorobowego w dniu porodu (Poradnik, s. 35).',
      },
    ],
    source: 'Poradnik, s. 35; ustawa o świadczeniach rodzinnych',
    actions: [],
  },
  {
    id: 'rodz',
    question: 'Ile trwa urlop rodzicielski i jak go podzielić?',
    keywords: [
      'urlop rodzicielski',
      'rodzicielski',
      'podzial urlopu',
      'czesci urlopu',
      'dzielic urlop',
      'naprzemiennie',
    ],
    answer: [
      {
        type: 'paragraph',
        text: '**41 tygodni** (1 dziecko) albo **43** (więcej dzieci). Każdy rodzic ma **9 tygodni nieprzenoszalnych**.',
      },
      {
        type: 'list',
        ordered: false,
        items: [
          'Możecie korzystać jednocześnie lub naprzemiennie.',
          'Maksymalnie **5 części**, do końca roku, w którym dziecko kończy 6 lat.',
          'Wniosek do pracodawcy najpóźniej 21 dni przed każdą częścią.',
          'Zasiłek: 70% (lub 81,5% przy wniosku do 21 dni po porodzie).',
        ],
      },
    ],
    source: 'art. 182¹a–182¹d KP; Poradnik, s. 31–32',
    actions: [],
  },
  {
    id: 'rodz6',
    question: 'Czy mogę wziąć rodzicielski w 6 częściach?',
    keywords: ['6 czesc', 'szosta czesc', 'szesc czesci', 'ile czesci', 'kolejna czesc'],
    answer: [
      {
        type: 'paragraph',
        text: '**Nie.** Urlop rodzicielski udziela się jednorazowo albo w **maksymalnie 5 częściach**. Do limitu liczą się też wnioski o zasiłek za rodzicielski złożone przez mamę lub tatę.',
      },
      {
        type: 'paragraph',
        text: 'ZUS odmawia zasiłku za 6. część — w aplikacji liczymy części za Ciebie.',
      },
    ],
    source: 'art. 182¹c i 182¹d § 2 KP',
    actions: [],
  },
  {
    id: 'rodz-praca',
    question: 'Czy mogę pracować na urlopie rodzicielskim?',
    keywords: [
      'laczyc urlop z praca',
      'praca na urlopie',
      'pol etatu',
      'czesc etatu',
      'wrocic na pol',
      'laczenie',
    ],
    answer: [
      {
        type: 'paragraph',
        text: 'Tak — u pracodawcy, który udzielił urlopu, maksymalnie na **pół etatu**.',
      },
      {
        type: 'list',
        ordered: false,
        items: [
          'Urlop wydłuża się proporcjonalnie, maksymalnie do 82 tygodni (86 przy więcej dzieciach).',
          'Zasiłek maleje proporcjonalnie do wymiaru pracy.',
          'Wniosek najpóźniej 21 dni przed podjęciem pracy. Pracodawca może odmówić tylko z powodu organizacji lub rodzaju pracy.',
        ],
      },
    ],
    source: 'art. 182¹e–182¹f KP; UZ art. 31 ust. 4a',
    actions: [],
  },
  {
    id: 'tata9',
    question: 'Ile urlopu rodzicielskiego ma tata?',
    keywords: [
      'tata rodzicielski',
      'ojciec rodzicielski',
      '9 tygodni',
      'nieprzenoszal',
      'czesc dla taty',
      'partner urlop',
      'ma tata',
      'tata urlopu rodzicielskiego',
      'tygodni tata',
    ],
    answer: [
      {
        type: 'paragraph',
        text: 'Każdy z rodziców ma **9 tygodni** urlopu rodzicielskiego, których nie można przenieść na drugiego. Jeśli tata ich nie wykorzysta — przepadną.',
      },
      {
        type: 'paragraph',
        text: 'Zasiłek za te 9 tygodni wynosi **zawsze 70%** podstawy taty, także gdy mama wybrała 81,5%. Niezależnie od tego tata ma 2 tygodnie urlopu ojcowskiego (100%).',
      },
    ],
    source: 'art. 182¹a § 4 KP; UZ art. 31 ust. 3f; Poradnik, s. 34',
    actions: [],
  },
  {
    id: 'ojcowski',
    question: 'Urlop ojcowski — ile i do kiedy?',
    keywords: ['ojcowski', 'urlop ojcowski', '2 tygodnie', 'dwa tygodnie', 'tacierzynski'],
    answer: [
      {
        type: 'paragraph',
        text: '**2 tygodnie**, płatne **100%**. Jednorazowo albo w 2 częściach po minimum 7 dni.',
      },
      {
        type: 'list',
        ordered: false,
        items: [
          'Trzeba wykorzystać do **ukończenia przez dziecko 12 miesięcy** — potem prawo wygasa.',
          'Wniosek do pracodawcy najpóźniej 7 dni przed.',
          'Przysługuje nawet wtedy, gdy mama nie jest ubezpieczona.',
        ],
      },
    ],
    source: 'art. 182³ KP; Poradnik, s. 32–33',
    actions: [],
  },
  {
    id: 'przejecie',
    question: 'Czy tata może przejąć część mojego macierzyńskiego?',
    keywords: [
      'przejac',
      'przejac urlop',
      'przejac macierzynski',
      'przekazac urlop',
      'rezygnacja z macierzynskiego',
      'rezygnuje',
      'wrocic do pracy wczesniej',
      '14 tygodni',
    ],
    answer: [
      {
        type: 'paragraph',
        text: 'Tak, po wykorzystaniu przez Ciebie co najmniej **14 tygodni** po porodzie. Pozostałą część może wziąć tata (albo ubezpieczony tata, który przerwie działalność zarobkową).',
      },
      {
        type: 'list',
        ordered: false,
        items: [
          'Twój wniosek o rezygnację — najpóźniej **7 dni** przed powrotem do pracy.',
          'Wniosek taty — najpóźniej **14 dni** przed rozpoczęciem.',
        ],
      },
    ],
    source: 'art. 180 § 4–9 KP; Poradnik, s. 30',
    actions: [],
  },
  {
    id: 'szpital',
    question: 'Mama jest w szpitalu — czy tata przejmie opiekę i zasiłek?',
    keywords: [
      'szpital',
      'oiom',
      'mama w szpitalu',
      'matka w szpitalu',
      'hospitalizacja mamy',
      'zona w szpitalu',
      'partnerka w szpitalu',
    ],
    answer: [
      {
        type: 'paragraph',
        text: 'Zależy od tego, ile minęło od porodu:',
      },
      {
        type: 'list',
        ordered: false,
        items: [
          '**Pierwsze 8 tygodni:** mama nie może przerwać macierzyńskiego. Tacie może przysługiwać **zasiłek opiekuńczy** (pobyt w szpitalu drugiego rodzica, który stale opiekuje się dzieckiem) — wniosek Z-15A.',
          '**Po 8 tygodniach:** mama może przerwać urlop na czas pobytu w szpitalu, a tata wykorzystuje tę część macierzyńskiego. Potrzebne jest zaświadczenie ze szpitala.',
        ],
      },
    ],
    source: 'art. 180 § 10–11 KP; Poradnik, s. 37',
    actions: [
      {
        label: 'Przeczytaj w Wiedzy',
        href: '/wiedza/artykul/szpital',
      },
    ],
  },
  {
    id: 'matka-nieub',
    question: 'Mama nie jest ubezpieczona — czy tata dostanie zasiłek?',
    keywords: [
      'matka nieubezpieczona',
      'mama nie ma ubezpieczenia',
      'zona nie pracuje',
      'partnerka nie pracuje',
      'tylko tata pracuje',
    ],
    answer: [
      {
        type: 'paragraph',
        text: 'Tak. Ubezpieczony tata może korzystać z zasiłku za **urlop rodzicielski**, także gdy mama nie jest objęta ubezpieczeniem chorobowym (finansuje to budżet państwa). Ma też własny urlop ojcowski.',
      },
      {
        type: 'paragraph',
        text: 'Część macierzyńskiego tata przejmuje, gdy nieubezpieczona mama podejmie pracę na co najmniej pół etatu, umrze, porzuci dziecko lub ma orzeczoną niezdolność do samodzielnej egzystencji.',
      },
    ],
    source: 'art. 180 § 15–17 KP; UZ art. 31 ust. 3h',
    actions: [],
  },
  {
    id: 'wczesniak',
    question: 'Moje dziecko jest wcześniakiem — czy przysługuje dodatkowy urlop?',
    keywords: [
      'wczesniak',
      'uzupelniajacy',
      'dziecko w szpitalu',
      'inkubator',
      '1000 g',
      'przed 28',
      'hospitalizacja dziecka',
      'neonatologia',
    ],
    answer: [
      {
        type: 'paragraph',
        text: 'Tak — **uzupełniający urlop macierzyński**, płatny **100%**, bezpośrednio po macierzyńskim. Tydzień urlopu za każdy tydzień pobytu dziecka w szpitalu:',
      },
      {
        type: 'list',
        ordered: false,
        items: [
          'do **15 tygodni** — poród przed 28. tygodniem ciąży lub masa ≤ 1000 g,',
          'do **8 tygodni** — poród między 28. a 37. tygodniem przy masie > 1000 g,',
          'do **8 tygodni** — poród po 37. tygodniu, gdy dziecko leży w szpitalu min. 2 kolejne dni, z początkiem między 5. a 28. dniem.',
        ],
      },
      {
        type: 'paragraph',
        text: 'Wniosek do pracodawcy najpóźniej **21 dni przed końcem** macierzyńskiego, z zaświadczeniem ze szpitala.',
      },
    ],
    source: 'art. 180² KP; Poradnik, s. 30–31',
    actions: [
      {
        label: 'Policz wymiar',
        href: '/kalkulator',
      },
    ],
  },
  {
    id: 'adopcja',
    question: 'Adoptujemy dziecko / jesteśmy rodziną zastępczą — co nam przysługuje?',
    keywords: [
      'adopcja',
      'adopt',
      'adoptowac',
      'przysposobienie',
      'rodzina zastepcza',
      'piecza zastepcza',
      'przyjecie dziecka',
      'przyjelismy dziecko',
    ],
    answer: [
      {
        type: 'paragraph',
        text: '**Urlop na warunkach urlopu macierzyńskiego** (20–37 tyg., min. 9 tyg.) i potem rodzicielski — z zasiłkiem jak przy urodzeniu.',
      },
      {
        type: 'list',
        ordered: false,
        items: [
          'Przysposobienie: dziecko do 14 lat. Niezawodowa rodzina zastępcza: dziecko do 7 lat (10 przy odroczeniu obowiązku szkolnego).',
          'Wniosek do pracodawcy w ciągu **7 dni** od przyjęcia. Urlop zaczyna się najpóźniej **21 dni** od przyjęcia.',
          'Nie przysługuje zawodowej rodzinie zastępczej.',
        ],
      },
    ],
    source: 'art. 183 KP; UZ art. 29; Poradnik, s. 30',
    actions: [],
  },
  {
    id: 'zazyciem',
    question: 'Dziecko ma zaświadczenie „Za życiem” — czy urlop jest dłuższy?',
    keywords: ['za zyciem', 'ciezka choroba', 'nieodwracalne', 'uposledzenie'],
    answer: [
      {
        type: 'paragraph',
        text: 'Tak. Urlop rodzicielski wynosi **65 tygodni** (1 dziecko) albo **67** (więcej). Przy łączeniu z pracą zasiłek może trwać do 130/134 tygodni. Każdy rodzic nadal ma 9 nieprzenoszalnych tygodni.',
      },
    ],
    source: 'art. 182¹a § 2 i 182¹f § 1¹ KP; Poradnik, s. 32',
    actions: [],
  },
  {
    id: 'blizneta',
    question: 'Urodziły się bliźnięta — ile trwają urlopy?',
    keywords: ['blizneta', 'blizniaki', 'trojaczki', 'ciaza mnoga', 'dwoje dzieci'],
    answer: [
      {
        type: 'paragraph',
        text: 'Macierzyński: **31 tygodni** (bliźnięta), 33 (trojaczki), 35, 37. Rodzicielski: **43 tygodnie**. Część mamy przy 81,5% to 34 tygodnie.',
      },
      {
        type: 'paragraph',
        text: 'Przy urlopie uzupełniającym liczy się najniższa masa urodzeniowa i najdłuższa hospitalizacja.',
      },
    ],
    source: 'art. 180 § 1, 180² § 2, 182¹a KP',
    actions: [],
  },
  {
    id: 'strata',
    question: 'Straciłam ciążę — co mi przysługuje?',
    keywords: [
      'poronienie',
      'poronilam',
      'stracilam ciaze',
      'strata ciazy',
      'martwe urodzenie',
      'urodzilam martwe',
      'obumarcie',
      'strata dziecka',
    ],
    answer: [
      {
        type: 'paragraph',
        text: 'Bardzo mi przykro. Napiszę tylko to, co ważne teraz.',
      },
      {
        type: 'list',
        ordered: false,
        items: [
          'Jeśli dziecko urodziło się martwe (bez względu na tydzień ciąży — na podstawie zaświadczenia o martwym urodzeniu od lekarza ginekologa lub położnej), masz prawo do **8 tygodni zasiłku macierzyńskiego** (100%).',
          'Przysługuje też **zasiłek pogrzebowy 7000 zł** — wniosek Z-12 w ciągu 12 miesięcy od pochówku.',
          'Pracodawca udziela urlopu okolicznościowego.',
        ],
      },
      {
        type: 'paragraph',
        text: 'Jeśli potrzebujesz rozmowy: **116 123** (telefon zaufania dla dorosłych). W nagłej sytuacji dzwoń na **112**.',
      },
    ],
    source: 'art. 180¹ KP; Poradnik, s. 33–36',
    actions: [
      {
        label: 'Włącz tryb wsparcia',
        href: '/wiecej/strata',
      },
    ],
    crisis: true,
  },
  {
    id: 'smierc',
    question: 'Moje dziecko zmarło — co z zasiłkiem?',
    keywords: ['dziecko zmarlo', 'smierc dziecka', 'zgon dziecka', 'umarlo'],
    answer: [
      {
        type: 'paragraph',
        text: 'Bardzo mi przykro.',
      },
      {
        type: 'list',
        ordered: false,
        items: [
          'Jeśli dziecko zmarło przed ukończeniem 8 tygodni życia, zasiłek macierzyński przysługuje przez 8 tygodni po porodzie, nie krócej niż 7 dni od śmierci.',
          'Jeśli zmarło później — przez 7 dni od śmierci.',
          'Przysługuje zasiłek pogrzebowy 7000 zł.',
        ],
      },
      {
        type: 'paragraph',
        text: 'Rozmowa: **116 123**.',
      },
    ],
    source: 'art. 180¹ KP; Poradnik, s. 33',
    actions: [
      {
        label: 'Tryb wsparcia',
        href: '/wiecej/strata',
      },
    ],
    crisis: true,
  },
  {
    id: 'pogrzebowy',
    question: 'Ile wynosi zasiłek pogrzebowy i jak go dostać?',
    keywords: ['pogrzebowy', 'pogrzeb', 'pochowek', 'z-12', 'z12'],
    answer: [
      {
        type: 'paragraph',
        text: '**7000 zł** (od 1.01.2026). Rodzice dostają pełną kwotę, nawet jeśli koszty były niższe.',
      },
      {
        type: 'list',
        ordered: false,
        items: [
          'Wniosek Z-12 w ciągu 12 miesięcy od pochówku (eZUS lub przez zakład pogrzebowy).',
          'Rachunki za pogrzeb.',
          'Akt urodzenia z adnotacją o martwym urodzeniu albo karta zgonu / zaświadczenie o martwym urodzeniu.',
        ],
      },
    ],
    source: 'Poradnik, s. 35–36; zus.pl',
    actions: [],
  },
  {
    id: 'opiekunczy',
    question: 'Dziecko zachorowało — czy dostanę zasiłek opiekuńczy?',
    keywords: [
      'opiekunczy',
      'chore dziecko',
      'dziecko choruje',
      'choroba dziecka',
      'zamkniety zlobek',
      'zlobek zamkniety',
      'z-15',
      'opieka nad dzieckiem l4',
    ],
    answer: [
      {
        type: 'paragraph',
        text: 'Tak — **80% podstawy**, łącznie do **60 dni w roku** na dzieci do 14 lat.',
      },
      {
        type: 'list',
        ordered: false,
        items: [
          'Chore dziecko do 14 lat albo zdrowe do 8 lat — np. nagłe zamknięcie żłobka (zawiadomienie poniżej 7 dni), choroba niani lub dziennego opiekuna, poród lub szpital drugiego rodzica.',
          'Wniosek **Z-15A** — zasiłek nie jest wypłacany automatycznie po zwolnieniu.',
          'Bez okresu wyczekiwania.',
        ],
      },
    ],
    source: 'Poradnik, s. 36–39',
    actions: [],
  },
  {
    id: 'wychowawczy',
    question: 'Jak działa urlop wychowawczy?',
    keywords: ['urlop wychowawczy', 'wychowawczy', '36 miesiecy', 'bezplatny urlop'],
    answer: [
      {
        type: 'paragraph',
        text: 'Do **36 miesięcy**, do końca roku, w którym dziecko kończy 6 lat. Każdy rodzic ma 1 miesiąc nieprzenoszalny. Potrzebny jest staż pracy min. 6 miesięcy.',
      },
      {
        type: 'paragraph',
        text: 'Urlop jest bezpłatny, ale budżet państwa (przez ZUS) opłaca składki emerytalne, rentowe i zdrowotną. Zasiłek macierzyński nie przysługuje za jego czas.',
      },
    ],
    source: 'art. 186 KP; Poradnik, s. 20 i 35',
    actions: [],
  },
  {
    id: 'ochrona',
    question: 'Czy pracodawca może mnie zwolnić w ciąży?',
    keywords: [
      '=zwolnic',
      '=zwolnia',
      '=zwolnili',
      '=zwolnic w ciazy',
      '=moga mnie zwolnic',
      'wypowiedzenie',
      '=zwolnienie z pracy',
      'czas okreslony',
      'umowa sie konczy',
      'przedluzenie umowy',
    ],
    answer: [
      {
        type: 'paragraph',
        text: '**Nie.** W ciąży i na urlopach rodzicielskich — od dnia złożenia wniosku — pracodawca nie może wypowiedzieć ani rozwiązać umowy (wyjątki: wina pracownicy za zgodą związków, upadłość lub likwidacja).',
      },
      {
        type: 'paragraph',
        text: 'Umowa na czas określony (lub próbna ponad 1 miesiąc), która skończyłaby się po 3. miesiącu ciąży, przedłuża się do dnia porodu. Nie dotyczy umowy na zastępstwo.',
      },
    ],
    source: 'art. 177 KP',
    actions: [],
  },
  {
    id: 'likwidacja',
    question: 'Mój pracodawca ogłosił likwidację — co z zasiłkiem?',
    keywords: ['likwidacja', 'upadlosc', 'firma upadla', 'pracodawca zamyka', 'smierc pracodawcy'],
    answer: [
      {
        type: 'paragraph',
        text: 'Jeśli umowę rozwiązano w ciąży z powodu upadłości lub likwidacji pracodawcy i nie zapewniono innej pracy, przysługuje Ci do porodu **zasiłek w wysokości zasiłku macierzyńskiego**, a potem zasiłek macierzyński — mimo ustania ubezpieczenia.',
      },
    ],
    source: 'UZ art. 30',
    actions: [],
  },
  {
    id: 'pozor',
    question: 'Czy mogę zatrudnić się tuż przed porodem, żeby dostać zasiłek?',
    keywords: [
      'pozorna umowa',
      'umowa dla pozoru',
      'fikcyjna umowa',
      'zatrudnic sie przed porodem',
      'podwyzka przed porodem',
      'wysoka podstawa',
    ],
    answer: [
      {
        type: 'paragraph',
        text: 'ZUS ostrzega przed takimi „poradami”. Umowa zawarta dla pozoru lub w celu obejścia prawa **nie rodzi skutków** w ubezpieczeniach. ZUS bada okoliczności zawarcia umowy i wysokość wynagrodzenia i może wydać decyzję o niepodleganiu ubezpieczeniom.',
      },
      {
        type: 'paragraph',
        text: 'Uczciwa praca w ciąży jest oczywiście w porządku — ważne, by praca była faktycznie wykonywana.',
      },
    ],
    source: 'Poradnik, s. 8 i 15',
    actions: [],
  },
  {
    id: 'przedawnienie',
    question: 'Do kiedy mogę złożyć wniosek o zasiłek?',
    keywords: ['przedawnienie', 'za pozno', 'spoznilam', 'zapomnialam zlozyc', '6 miesiecy'],
    answer: [
      {
        type: 'paragraph',
        text: 'Roszczenie o zasiłek chorobowy, macierzyński lub opiekuńczy przedawnia się po **6 miesiącach** od ostatniego dnia okresu, za który przysługuje. Jeśli spóźnienie wynika z przyczyn od Ciebie niezależnych, termin liczy się od ustania przeszkody. Przy błędzie ZUS lub płatnika — 3 lata.',
      },
    ],
    source: 'UZ art. 67; Poradnik, s. 27 i 35',
    actions: [],
  },
  {
    id: 'maloletnia',
    question: 'Mam 17 lat i jestem w ciąży — czy mogę sama złożyć wniosek?',
    keywords: ['17 lat', '16 lat', 'niepelnoletnia', 'maloletnia', 'nastolatka', 'nie mam 18'],
    answer: [
      {
        type: 'paragraph',
        text: 'To zależy od rodzaju wniosku i Twojej sytuacji (np. pracujesz, jesteś w związku małżeńskim). Część spraw może za Ciebie lub z Tobą załatwić rodzic albo opiekun prawny.',
      },
      {
        type: 'paragraph',
        text: 'Najlepiej **umów e-wizytę** albo napisz na **mama@zus.pl** — konsultant przeprowadzi Cię przez to krok po kroku.',
      },
    ],
    source: 'Kodeks cywilny art. 21–22 (wymaga weryfikacji prawnej)',
    actions: [
      {
        label: 'Kontakt z ZUS',
        href: '/wiecej/kontakt',
      },
    ],
  },
  {
    id: 'kontakt',
    question: 'Jak porozmawiać z człowiekiem z ZUS?',
    keywords: [
      'kontakt',
      'telefon',
      'infolinia',
      'e-wizyta',
      'ewizyta',
      'mama@zus',
      'konsultant',
      'czlowiek',
      'porozmawiac',
      'email zus',
    ],
    answer: [
      {
        type: 'list',
        ordered: false,
        items: [
          'E-mail dla rodziców: **mama@zus.pl**,',
          'infolinia: **22 560 16 00**, e-mail: cot@zus.pl,',
          '**e-wizyta** — rozmowa wideo z ekspertem ZUS,',
          'dowolna placówka ZUS.',
        ],
      },
    ],
    source: 'Poradnik, s. 6 i 39',
    actions: [
      {
        label: 'Umów e-wizytę',
        href: '/wiecej/kontakt',
      },
    ],
  },
  {
    id: 'offline',
    question: 'Czy aplikacja działa bez internetu?',
    keywords: ['offline', 'bez internetu', 'brak zasiegu', 'nie ma zasiegu', 'w szpitalu bez'],
    answer: [
      {
        type: 'paragraph',
        text: 'Tak. Dokumenty oznaczone „Dostępne offline” (np. potwierdzenie ubezpieczenia, decyzje, Twoje szkice) są zapisane w telefonie i zabezpieczone PIN-em. Pokażesz je na izbie przyjęć bez zasięgu.',
      },
    ],
    source: 'mZUS dla Rodzica (funkcja prototypu)',
    actions: [
      {
        label: 'Dokumenty',
        href: '/wiecej/wiadomosci',
      },
    ],
  },
  {
    id: 'formularze',
    question: 'Co oznaczają skróty ZAM, ZAS-53, Z-3, Z-15A?',
    keywords: [
      'zam',
      'zas-53',
      'zas53',
      'z-3b',
      'z3b',
      'z-3a',
      'z-15a',
      'z15a',
      'zua',
      'zur',
      'zao',
      'zas-12',
      'formularz',
      'druk',
      'co to jest z',
      'skrot',
    ],
    answer: [
      {
        type: 'list',
        ordered: false,
        items: [
          '**ZAM** — wniosek o zasiłek macierzyński (od 24.10.2026 także za urlop rodzicielski i ojcowski — dawne ZUR i ZAO),',
          '**ZAS-53** — wniosek o zasiłek chorobowy (np. osoba prowadząca firmę),',
          '**Z-3 / Z-3a** — zaświadczenie płatnika dla pracownika / zleceniobiorcy; **ZAS-12** — na dalszy okres,',
          '**Z-15A** — wniosek o zasiłek opiekuńczy na dziecko,',
          '**Z-12** — wniosek o zasiłek pogrzebowy,',
          '**ZUS ZUA** — zgłoszenie do ubezpieczeń; **ZUS ZCNA** — zgłoszenie dziecka do ubezpieczenia zdrowotnego.',
        ],
      },
      {
        type: 'paragraph',
        text: 'Z-3b zlikwidowano od 24.10.2026. O urlopy prosisz pracodawcę pismem — kreator przygotuje je za Ciebie.',
      },
    ],
    source: 'Opis wyzwania ZUS (HackNation 2026); Poradnik, s. 25–38',
    actions: [],
  },
  {
    id: 'kontrola',
    question: 'ZUS wszczął postępowanie wyjaśniające w mojej firmie — co przygotować?',
    keywords: [
      'postepowanie wyjasniajace',
      'kontrola zus',
      'wezwanie',
      'zus sprawdza',
      'dowody dzialalnosci',
      'zus kwestionuje',
    ],
    answer: [
      {
        type: 'paragraph',
        text: 'ZUS może sprawdzić, czy działalność była faktycznie prowadzona i czy podstawa składek jest uzasadniona. Przygotuj m.in.: faktury i umowy z klientami, potwierdzenia przelewów, korespondencję handlową, ewidencję przychodów i dowody opłacania składek.',
      },
      {
        type: 'paragraph',
        text: 'W aplikacji: **Wiadomości → Checklista dowodowa JDG** — z możliwością zrobienia zdjęć.',
      },
    ],
    source: 'Poradnik, s. 15',
    actions: [],
  },
  {
    id: 'pit',
    question: 'Czy od zasiłku płacę podatek i składki?',
    keywords: [
      'podatek',
      'pit',
      'netto zasilek',
      'skladka zdrowotna',
      'skladki od zasilku',
      'emerytura z macierzynskiego',
    ],
    answer: [
      {
        type: 'list',
        ordered: false,
        items: [
          'Od zasiłku potrąca się **zaliczkę na PIT** (bez kosztów uzyskania przychodu).',
          '**Składki zdrowotnej** od zasiłku macierzyńskiego się nie płaci — opiekę zdrowotną zapewnia NFZ.',
          'Składki **emerytalne i rentowe** za czas zasiłku finansuje budżet państwa — okres ten liczy się do emerytury.',
        ],
      },
    ],
    source: 'Poradnik, s. 19–20, 24',
    actions: [],
  },
  {
    id: 'prywatnosc',
    question: 'Co się dzieje z danymi, które wpisuję w czacie?',
    keywords: [
      'dane',
      'prywatnosc',
      'rodo',
      'czy zapisujesz',
      'kto widzi',
      'jestes ai',
      'sztuczna inteligencja',
      'bot',
    ],
    answer: [
      {
        type: 'paragraph',
        text: 'Jestem asystentem AI — informuję o tym zgodnie z AI Act. Nie podejmuję decyzji o świadczeniach. W trybie AI do modelu trafia tylko treść pytania i ogólny kontekst (np. „ciąża, umowa o pracę”) — bez imienia, PESEL i numerów kont. Nie wpisuj w czacie danych medycznych, których nie musisz podawać.',
      },
    ],
    source: 'RODO; AI Act art. 50',
    actions: [],
  },
  {
    id: 'rehab',
    question: 'Co po 270 dniach zwolnienia w ciąży?',
    keywords: [
      '270 dni minelo',
      'po 270',
      'swiadczenie rehabilitacyjne',
      'rehabilitacyjne',
      'wyczerpany okres zasilkowy',
      'koniec okresu zasilkowego',
    ],
    answer: [
      {
        type: 'paragraph',
        text: 'Gdy wyczerpiesz okres zasiłkowy (w ciąży 270 dni), a leczenie rokuje powrót do pracy, możesz dostać **świadczenie rehabilitacyjne** — do 12 miesięcy.',
      },
      {
        type: 'list',
        ordered: false,
        items: [
          'W ciąży wynosi **100% podstawy** (poza ciążą 90% przez 3 miesiące, potem 75%).',
          'O prawie orzeka lekarz orzecznik ZUS. Wniosek złóż kilka tygodni przed końcem zasiłku.',
        ],
      },
    ],
    source: 'art. 18–19 ustawy zasiłkowej',
    actions: [
      {
        label: 'Karta świadczenia',
        href: '/wiedza/artykul/okres-zasilkowy',
      },
    ],
  },
  {
    id: 'zwzm',
    question: 'Straciłam pracę w ciąży — czy coś mi przysługuje?',
    keywords: [
      'stracilam prace',
      'utrata pracy w ciazy',
      'zwolniona w ciazy',
      'koniec umowy w ciazy',
      'w wysokosci zasilku macierzynskiego',
    ],
    answer: [
      {
        type: 'paragraph',
        text: 'Jeśli umowę rozwiązano w ciąży z powodu **upadłości, likwidacji lub śmierci pracodawcy** (i nie zapewniono innej pracy) albo **z naruszeniem prawa** potwierdzonym prawomocnym wyrokiem — dostajesz **zasiłek w wysokości zasiłku macierzyńskiego** (100%) do porodu, a potem zasiłek macierzyński.',
      },
      {
        type: 'paragraph',
        text: 'Inne zakończenie umowy (np. porozumienie stron) zwykle oznacza brak ubezpieczenia chorobowego na dzień porodu, czyli brak zasiłku macierzyńskiego. Wtedy przysługuje świadczenie rodzicielskie z gminy.',
      },
    ],
    source: 'art. 30 ustawy zasiłkowej; opis wyzwania ZUS',
    actions: [
      {
        label: 'Ryzyka utraty zasiłku',
        href: '/wiedza/artykul/ryzyka',
      },
    ],
  },
  {
    id: 'wyczekiwanie',
    question: 'Od kiedy mam prawo do zasiłku chorobowego?',
    keywords: [
      'okres wyczekiwania',
      'od kiedy zasilek chorobowy',
      'prawo do zasilku chorobowego',
      'od kiedy mam prawo',
      'nowa praca l4',
      'dopiero zaczelam prace',
      '30 dni',
      '90 dni ubezpieczenia',
    ],
    answer: [
      {
        type: 'paragraph',
        text: 'Do **zasiłku chorobowego** masz prawo po **30 dniach** nieprzerwanego ubezpieczenia obowiązkowego (np. etat) albo po **90 dniach** dobrowolnego (zlecenie, firma).',
      },
      {
        type: 'paragraph',
        text: 'Do **zasiłku macierzyńskiego** okres wyczekiwania nie obowiązuje — liczy się to, czy w dniu porodu masz ubezpieczenie chorobowe.',
      },
    ],
    source: 'art. 4 ustawy zasiłkowej; opis wyzwania ZUS',
    actions: [
      {
        label: 'Kalkulator zasiłków',
        href: '/kalkulator',
      },
    ],
  },
  {
    id: 'organizacje',
    question: 'Gdzie szukać wsparcia po stracie dziecka albo przy wcześniaku?',
    keywords: [
      'fundacja',
      'fundacje',
      'stowarzyszenie',
      'wsparcie psychologiczne',
      'grupa wsparcia',
      'hospicjum',
      'hospicjum perinatalne',
      'pomoc po stracie',
      'ciezko chore dziecko',
    ],
    answer: [
      {
        type: 'paragraph',
        text: 'Organizacje, które pomagają rodzicom w trudnych sytuacjach (działalność charytatywna):',
      },
      {
        type: 'list',
        ordered: false,
        items: [
          '**Fundacja Rodzić po Ludzku** — poronienie, strata ciąży, prawa pacjentki,',
          '**Stowarzyszenie Rodziców po Poronieniu** i **Bractwo Małych Stópek** — wsparcie po stracie,',
          '**Fundacja Wcześniak Rodzice-Rodzicom** — wcześniaki,',
          '**Hospicja perinatalne** (np. Fundacja Gajusz, Warszawskie Hospicjum dla Dzieci, Pomorze Dzieciom) — ciężko chore dziecko.',
        ],
      },
      {
        type: 'paragraph',
        text: 'Telefon zaufania: **116 123**. Pełna lista w aplikacji: Więcej → Wsparcie i organizacje.',
      },
    ],
    source: 'Opis wyzwania ZUS (wymaganie „i”); pacjent.gov.pl',
    actions: [
      {
        label: 'Wsparcie i organizacje',
        href: '/wiecej/wsparcie',
      },
    ],
    crisis: true,
  },
  {
    id: 'odpis',
    question: 'Jak zamówić odpis aktu urodzenia?',
    keywords: [
      'odpis aktu',
      'odpis skrocony',
      'odpis zupelny',
      'akt urodzenia odpis',
      'rejestr stanu cywilnego',
    ],
    answer: [
      {
        type: 'paragraph',
        text: 'Odpis skrócony lub zupełny aktu urodzenia zamówisz online przez gov.pl (rejestr stanu cywilnego) albo w dowolnym USC.',
      },
      {
        type: 'paragraph',
        text: 'Do zasiłku macierzyńskiego zwykle nie musisz go dostarczać — ZUS może sam pobrać odpis z rejestru. W aplikacji przygotujesz wniosek w kilku krokach (symulacja).',
      },
    ],
    source: 'gov.pl — rejestr stanu cywilnego; Poradnik ZUS, s. 34',
    actions: [],
  },
];
