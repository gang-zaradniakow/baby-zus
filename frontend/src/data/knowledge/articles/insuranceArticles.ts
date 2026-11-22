import type { Article } from '@/domain/knowledge/Article';

/** Rozdział „Ubezpieczenie — klucz do zasiłków” — wygenerowane z prototypu (js/wiedza.js), treść: Poradnik ZUS. */
export const INSURANCE_ARTICLES: readonly Article[] = [
  {
    id: 'pracownicy',
    chapterId: 'ubezp',
    title: 'Pracownicy',
    lead: 'Pracownik podlega obowiązkowo wszystkim ubezpieczeniom społecznym — także chorobowemu.',
    source: 'Poradnik, s. 6–8',
    body: [
      {
        type: 'paragraph',
        text: 'Nie ma znaczenia wymiar czasu pracy, inny tytuł do ubezpieczeń, prawo do emerytury czy status studenta. Ubezpieczenie trwa od dnia nawiązania do dnia ustania stosunku pracy. Składkę chorobową (2,45%) finansuje pracownik.',
      },
      {
        type: 'important',
        text: 'Nie zawierajcie umowy o pracę dla pozoru, żeby uzyskać świadczenia. ZUS bada okoliczności zawarcia umowy i wysokość wynagrodzenia — może wydać decyzję o niepodleganiu ubezpieczeniom albo ustalić niższą podstawę składek.',
      },
    ],
    links: ['rodzice'],
  },
  {
    id: 'zleceniobiorcy',
    chapterId: 'ubezp',
    title: 'Zleceniobiorcy',
    lead: 'Na umowie zlecenia ubezpieczenie chorobowe jest dobrowolne — trzeba się do niego zgłosić.',
    source: 'Poradnik, s. 9–11',
    body: [
      {
        type: 'paragraph',
        text: 'Zleceniobiorca podlega obowiązkowo ubezpieczeniom emerytalnemu, rentowym i wypadkowemu. Chorobowe — tylko na swój wniosek.',
      },
      {
        type: 'important',
        text: 'Do dobrowolnego chorobowego nie można zgłosić się wstecz. Ubezpieczenie zaczyna się od dnia wskazanego w zgłoszeniu ZUS ZUA, ale nie wcześniej niż w dniu jego złożenia (wyjątek: zgłoszenie w ciągu 7 dni od powstania obowiązku ubezpieczeń).',
      },
      {
        type: 'list',
        ordered: false,
        items: [
          'Masz też umowę o pracę z co najmniej minimalnym wynagrodzeniem? Ze zlecenia nie możesz mieć dobrowolnego chorobowego.',
          'Student lub uczeń do 26 lat na zleceniu nie podlega ubezpieczeniom społecznym.',
        ],
      },
    ],
    links: ['rodzice'],
  },
  {
    id: 'jdg',
    chapterId: 'ubezp',
    title: 'Osoby prowadzące działalność',
    lead: 'Dla przedsiębiorcy ubezpieczenie chorobowe jest dobrowolne. Bez niego nie ma zasiłku chorobowego ani macierzyńskiego.',
    source: 'Poradnik, s. 12–18 i 24; opis wyzwania ZUS',
    body: [
      {
        type: 'list',
        ordered: false,
        items: [
          '**Ulga na start** — przez maks. 6 miesięcy nie podlegasz ubezpieczeniom społecznym, więc nie masz ochrony chorobowej. Możesz z niej zrezygnować wcześniej.',
          '**Preferencyjna podstawa** — co najmniej 30% minimalnego wynagrodzenia przez 24 miesiące.',
          '**Mały ZUS+** — przy przychodzie do 120 000 zł w poprzednim roku; niższe składki przez 36 miesięcy w każdych 60.',
          'Etat z co najmniej minimalnym wynagrodzeniem + firma: ubezpieczenia ze stosunku pracy, z firmy chorobowego mieć nie możesz.',
        ],
      },
      {
        type: 'important',
        text: 'Zaległość w składkach ponad 1% minimalnego wynagrodzenia (48,06 zł w 2026) w dniu powstania prawa blokuje wypłatę zasiłku do spłaty całości. Jeśli nie spłacisz jej w 6 miesięcy, prawo do zasiłku przepada.',
      },
      {
        type: 'important',
        text: 'Gdy zaczniesz pobierać zasiłek macierzyński, zostaniesz automatycznie wyrejestrowana z dobrowolnego chorobowego. Po zakończeniu zasiłku zgłoś się ponownie (ZUS ZUA).',
      },
    ],
    links: ['rodzice'],
  },
  {
    id: 'na-zasilku',
    chapterId: 'ubezp',
    title: 'Na zasiłku macierzyńskim i urlopie wychowawczym',
    lead: 'W czasie zasiłku macierzyńskiego składki emerytalne i rentowe opłaca za Was budżet państwa.',
    source: 'Poradnik, s. 19–20 i 35',
    body: [
      {
        type: 'list',
        ordered: false,
        items: [
          'Podstawą składek jest kwota zasiłku. Okres zasiłku liczy się do emerytury.',
          'Od zasiłku macierzyńskiego nie opłaca się składki zdrowotnej — prawo do leczenia zapewnia NFZ.',
          'Na urlopie wychowawczym składki emerytalne, rentowe i zdrowotną finansuje budżet państwa (jeśli nie macie innego tytułu do ubezpieczeń).',
        ],
      },
      {
        type: 'important',
        text: 'Za czas urlopu wychowawczego zasiłek macierzyński nie przysługuje.',
      },
    ],
    links: ['rodzice'],
  },
];
