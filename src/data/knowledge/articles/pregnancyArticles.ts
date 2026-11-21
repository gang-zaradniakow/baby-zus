import type { Article } from '@/domain/knowledge/Article';

/** Rozdział „W ciąży” — wygenerowane z prototypu (js/wiedza.js), treść: Poradnik ZUS. */
export const PREGNANCY_ARTICLES: readonly Article[] = [
  {
    id: 'l4-ciaza',
    chapterId: 'ciaza',
    title: 'Zwolnienie lekarskie w ciąży (kod B)',
    lead: 'Zwolnienie z kodem B oznacza niezdolność do pracy w okresie ciąży i daje 100% podstawy.',
    source: 'Poradnik, s. 23–24',
    body: [
      {
        type: 'paragraph',
        text: 'Lekarz wystawia e-ZLA z powodu **choroby w okresie ciąży** — sama ciąża nie jest podstawą do zwolnienia. Zaświadczenie trafia elektronicznie do ZUS i pracodawcy.',
      },
      {
        type: 'list',
        ordered: false,
        items: [
          '**Pracownica:** za pierwsze 33 dni w roku (14 dni po ukończeniu 50 lat) pracodawca wypłaca wynagrodzenie chorobowe, od 34. dnia — zasiłek chorobowy.',
          '**Duży płatnik** (21+ osób) sam wypłaca zasiłek; **mały** przekazuje dokumenty do ZUS (Z-3, na dalszy okres ZAS-12), a ZUS wypłaca w ciągu 30 dni od wyjaśnienia ostatniej okoliczności.',
          '**Zleceniobiorczyni:** zasiłek od 1. dnia; płatnik przekazuje Z-3a.',
          '**Przedsiębiorczyni:** zasiłek od 1. dnia, wypłaca ZUS — wniosek ZAS-53.',
        ],
      },
      {
        type: 'important',
        text: 'Prawo do zasiłku chorobowego powstaje po 30 dniach nieprzerwanego ubezpieczenia obowiązkowego albo po 90 dniach dobrowolnego.',
      },
    ],
    links: ['rodzice'],
    calculator: 'ciaza',
  },
  {
    id: 'okres-zasilkowy',
    chapterId: 'ciaza',
    title: 'Okres zasiłkowy i świadczenie rehabilitacyjne',
    lead: 'W ciąży okres zasiłkowy trwa do 270 dni zamiast 182.',
    source: 'Poradnik, s. 24; ustawa zasiłkowa art. 18–19',
    body: [
      {
        type: 'paragraph',
        text: 'Do jednego okresu sumuje się zwolnienia bez przerwy oraz te z przerwą krótszą niż 61 dni. Jeśli przed ciążą chorowałaś (zwolnienia bez kodu B), a potem dostałaś zwolnienie z kodem B, okres zasiłkowy liczy się od nowa — nawet przy przerwie krótszej niż 61 dni.',
      },
      {
        type: 'paragraph',
        text: 'Gdy wyczerpiesz okres zasiłkowy, a leczenie rokuje powrót do pracy, możesz ubiegać się o **świadczenie rehabilitacyjne** — do 12 miesięcy; w ciąży w wysokości 100% podstawy. Orzeka lekarz orzecznik ZUS.',
      },
    ],
    links: ['rodzice'],
  },
  {
    id: 'wysokosc-chorobowego',
    chapterId: 'ciaza',
    title: 'Wysokość zasiłku chorobowego w ciąży',
    lead: 'Zasiłek z kodem B wynosi 100% podstawy wymiaru od pierwszego dnia zwolnienia.',
    source: 'Poradnik, s. 24–25',
    body: [
      {
        type: 'list',
        ordered: false,
        items: [
          '**Pracownica:** podstawa to przeciętne wynagrodzenie brutto z 12 miesięcy przed miesiącem zwolnienia (albo z pełnych miesięcy, gdy pracujesz krócej). Pomija się miesiące, w których z usprawiedliwionych przyczyn przepracowałaś mniej niż połowę czasu pracy.',
          'Od podstawy odejmuje się 13,71% składek, a od zasiłku — zaliczkę PIT.',
          'Przy pełnym etacie podstawa nie może być niższa niż minimalne wynagrodzenie minus 13,71% (4147,10 zł w 2026).',
          '**Niepracownica:** podstawą jest przychód, od którego opłacałaś składkę chorobową przez 12 miesięcy, minus 13,71%.',
        ],
      },
      {
        type: 'important',
        text: 'U tego samego pracodawcy podstawy nie liczy się na nowo, jeśli przerwa między zasiłkami była krótsza niż miesiąc kalendarzowy (chyba że zmienił się wymiar czasu pracy).',
      },
    ],
    links: ['rodzice'],
    calculator: 'ciaza',
  },
  {
    id: 'kontrola',
    chapterId: 'ciaza',
    title: 'Kontrola zwolnień lekarskich',
    lead: 'Na zwolnieniu nie wolno pracować zarobkowo ani robić niczego, co utrudnia leczenie.',
    source: 'Poradnik, s. 26–27',
    body: [
      {
        type: 'paragraph',
        text: '**Dozwolone** są zwykłe czynności dnia codziennego (zakupy, wizyta w przychodni, krótki spacer, odprowadzenie dziecka do przedszkola) i czynności incydentalne wymagane przez istotne okoliczności (odpowiedź na maila, **podpisanie faktury**, pilna sprawa urzędowa).',
      },
      {
        type: 'paragraph',
        text: 'ZUS lub płatnik może skontrolować zwolnienie od pierwszego dnia — w domu, w pracy albo zdalnie na podstawie dokumentów. Kontrolerzy mają upoważnienia.',
      },
      {
        type: 'important',
        text: 'Jeśli zwolnienie było wykorzystywane niewłaściwie, tracisz prawo do zasiłku za cały okres zwolnienia i musisz go zwrócić z odsetkami.',
      },
    ],
    links: [],
  },
  {
    id: 'przedawnienie',
    chapterId: 'ciaza',
    title: 'Przedawnienie roszczenia o zasiłek',
    lead: 'Wniosek o zasiłek chorobowy lub macierzyński złóż w ciągu 6 miesięcy.',
    source: 'Poradnik, s. 27 i 35',
    body: [
      {
        type: 'paragraph',
        text: 'Roszczenie przedawnia się po 6 miesiącach od ostatniego dnia okresu, za który zasiłek przysługuje. Jeśli zasiłku nie wypłacono z winy ZUS lub dużego płatnika — po 3 latach. Gdy nie mogłaś zgłosić roszczenia z przyczyn niezależnych od Ciebie, 6 miesięcy liczy się od ustania przeszkody.',
      },
    ],
    links: [],
  },
  {
    id: 'mac-przed-porodem',
    chapterId: 'ciaza',
    title: 'Urlop macierzyński przed porodem',
    lead: 'Zasiłek macierzyński możesz zacząć pobierać do 6 tygodni przed przewidywaną datą porodu.',
    source: 'Poradnik, s. 27–29',
    body: [
      {
        type: 'list',
        ordered: false,
        items: [
          'Wniosek najpóźniej **14 dni** przed planowanym rozpoczęciem, z zaświadczeniem o przewidywanej dacie porodu.',
          'Zasiłek wynosi 100% podstawy. Jeśli w ciąży pobierałaś zasiłek chorobowy, podstawa jest taka sama.',
          'Pracownica składa wniosek u pracodawcy; przedsiębiorczyni — w ZUS (ZAM).',
        ],
      },
    ],
    links: ['macUrodzenie'],
  },
  {
    id: 'utrata-pracy',
    chapterId: 'ciaza',
    title: 'Utrata pracy w ciąży i ochrona pracownicy',
    lead: 'W ciąży i na urlopach rodzicielskich pracodawca co do zasady nie może Cię zwolnić.',
    source: 'Opis wyzwania ZUS (pkt I); art. 30 ustawy zasiłkowej; art. 177 KP',
    body: [
      {
        type: 'paragraph',
        text: 'Umowa na czas określony lub na okres próbny ponad miesiąc, która skończyłaby się po 3. miesiącu ciąży, przedłuża się do dnia porodu. Ochrona nie dotyczy osób, które nie są pracownikami (np. przedsiębiorców).',
      },
      {
        type: 'paragraph',
        text: '**Zasiłek w wysokości zasiłku macierzyńskiego** (100%) przysługuje do porodu, gdy w ciąży rozwiązano z Tobą umowę z powodu upadłości, likwidacji lub śmierci pracodawcy i nie zapewniono innego zatrudnienia, albo z naruszeniem prawa potwierdzonym prawomocnym wyrokiem.',
      },
    ],
    links: ['macPoUstaniu', 'pip'],
  },
];
