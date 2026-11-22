import type { Article } from '@/domain/knowledge/Article';

/** Rozdział „Gdy dziecko choruje” — wygenerowane z prototypu (js/wiedza.js), treść: Poradnik ZUS. */
export const CARE_ARTICLES: readonly Article[] = [
  {
    id: 'opiekunczy',
    chapterId: 'opieka',
    title: 'Zasiłek opiekuńczy',
    lead: 'Przysługuje, gdy musicie zostać w domu z dzieckiem — wynosi 80% podstawy.',
    source: 'Poradnik, s. 36–39',
    body: [
      {
        type: 'paragraph',
        text: '**Kiedy:**',
      },
      {
        type: 'list',
        ordered: false,
        items: [
          'chore dziecko do 14 lat,',
          'zdrowe dziecko do 8 lat — przy nieprzewidzianym zamknięciu żłobka, przedszkola lub szkoły (zawiadomienie krócej niż 7 dni przed), izolacji, chorobie niani lub dziennego opiekuna, porodzie, chorobie lub pobycie w szpitalu drugiego rodzica, który stale opiekuje się dzieckiem,',
          'dziecko z niepełnosprawnością do 18 lat (chore albo w szczególnych sytuacjach).',
        ],
      },
      {
        type: 'paragraph',
        text: '**Ile dni w roku:** 60 dni na dzieci do 14 lat, 30 dni na chore dziecko z niepełnosprawnością w wieku 14–18 lat, 14 dni na starsze dziecko lub innego członka rodziny — łącznie nie więcej niż 60 dni, bez względu na liczbę dzieci i opiekunów.',
      },
      {
        type: 'important',
        text: 'Zasiłek nie jest wypłacany automatycznie po wystawieniu zwolnienia — złóż wniosek Z-15A (pracownicy u pracodawcy). Przysługuje od pierwszego dnia ubezpieczenia; nie przysługuje, gdy opiekę może zapewnić inny członek rodziny (chyba że chore dziecko ma mniej niż 2 lata).',
      },
    ],
    links: ['rodzice'],
    wizard: 'w-opiekunczy',
  },
];
