import type { Article } from '@/domain/knowledge/Article';

/** Rozdział „Trudne sytuacje” — wygenerowane z prototypu (js/wiedza.js), treść: Poradnik ZUS. */
export const DIFFICULT_ARTICLES: readonly Article[] = [
  {
    id: 'martwe-urodzenie',
    chapterId: 'trudne',
    title: 'Gdy dziecko urodzi się martwe lub umrze',
    lead: 'System przewiduje czas na regenerację fizyczną i psychiczną bez konieczności powrotu do pracy.',
    source: 'Poradnik, s. 33',
    body: [
      {
        type: 'list',
        ordered: false,
        items: [
          'Dziecko urodziło się martwe lub zmarło przed upływem 8 tygodni życia: zasiłek macierzyński przez **8 tygodni po porodzie**, nie krócej niż 7 dni od śmierci dziecka.',
          'Dziecko zmarło po 8. tygodniu: zasiłek przez **7 dni** od dnia śmierci.',
          'Przy kilkorgu dzieci urlop odpowiada liczbie dzieci, które żyją.',
          'Zasiłek wynosi 100% — tak samo dla pracownicy, jak i np. przedsiębiorczyni.',
        ],
      },
      {
        type: 'paragraph',
        text: '**Dokumenty:** odpis skrócony aktu urodzenia z adnotacją o martwym urodzeniu, a gdy aktu nie sporządzono — zaświadczenie o martwym urodzeniu od lekarza (specjalisty lub w trakcie specjalizacji z położnictwa i ginekologii) albo położnej.',
      },
    ],
    links: ['martwe'],
    sensitive: true,
  },
  {
    id: 'pogrzebowy',
    chapterId: 'trudne',
    title: 'Zasiłek pogrzebowy, gdy dziecko urodzi się martwe',
    lead: 'Przysługuje 7000 zł — bez względu na czas trwania ciąży.',
    source: 'Poradnik, s. 35–36',
    body: [
      {
        type: 'list',
        ordered: false,
        items: [
          'Otrzymuje go osoba, która zorganizowała pogrzeb i pokryła jego koszty.',
          'Wniosek Z-12 do ZUS w ciągu 12 miesięcy od pochówku, z rachunkami.',
          'Gdy nie sporządzono aktu urodzenia z adnotacją: karta zgonu albo zaświadczenie o martwym urodzeniu.',
        ],
      },
      {
        type: 'important',
        text: 'Rodzicom przysługuje pełna kwota 7000 zł, nawet jeśli koszty pogrzebu były niższe.',
      },
    ],
    links: ['pogrzebowy', 'martwe'],
    wizard: 'w-pogrzebowy',
    sensitive: true,
  },
  {
    id: 'szpital',
    chapterId: 'trudne',
    title: 'Mama w szpitalu',
    lead: 'Gdy mama po porodzie trafia do szpitalu, opiekę może przejąć tata.',
    source: 'Art. 180 § 10–11 KP; Poradnik, s. 37',
    body: [
      {
        type: 'list',
        ordered: false,
        items: [
          '**Pierwsze 8 tygodni:** tata może dostać zasiłek opiekuńczy (pobyt w szpitalu drugiego rodzica, który stale opiekuje się dzieckiem).',
          '**Po 8 tygodniach:** mama może przerwać urlop macierzyński na czas pobytu w szpitalu, a tata wykorzystuje tę część urlopu (zasiłek 100%). Potrzebne jest zaświadczenie ze szpitala.',
        ],
      },
    ],
    links: ['tata'],
    wizard: 'w-przejecie',
  },
  {
    id: 'wsparcie',
    chapterId: 'trudne',
    title: 'Organizacje i telefony wsparcia',
    lead: 'Fundacje i stowarzyszenia, które pomagają rodzicom po stracie dziecka, przy wcześniaku lub ciężkiej chorobie dziecka.',
    source: 'Opis wyzwania ZUS (wymaganie „i”)',
    body: [
      {
        type: 'paragraph',
        text: 'Pełna lista organizacji działających charytatywnie oraz telefony wsparcia są na osobnym ekranie.',
      },
    ],
    links: [],
    sensitive: true,
  },
];
