import type { Article } from '@/domain/knowledge/Article';

/** Rozdział „Ryzyka — czego unikać” — wygenerowane z prototypu (js/wiedza.js), treść: Poradnik ZUS. */
export const RISKS_ARTICLES: readonly Article[] = [
  {
    id: 'ryzyka',
    chapterId: 'ryzyka',
    title: 'Kiedy można stracić albo obniżyć świadczenie',
    lead: 'Większość odmów wynika z kilku powtarzalnych sytuacji. Sprawdźcie je, zanim zmienicie warunki zatrudnienia w ciąży.',
    source: 'Opis wyzwania ZUS (pkt H); Poradnik, s. 8, 15, 24, 27, 35',
    body: [
      {
        type: 'list',
        ordered: true,
        items: [
          '**Umowa lub firma dla pozoru** — ZUS może wydać decyzję o niepodleganiu ubezpieczeniom.',
          '**Podwyższenie podstawy składek w ciąży** tylko po to, by dostać wyższy zasiłek — ZUS może ustalić niższą podstawę.',
          '**Brak ubezpieczenia chorobowego w dniu porodu** — np. rozwiązanie umowy, zamknięcie firmy lub koniec zlecenia przed porodem, niezgłoszenie się do dobrowolnego chorobowego.',
          '**Zaległość w składkach** przedsiębiorcy ponad 1% minimalnego wynagrodzenia.',
          '**Praca zarobkowa na zwolnieniu** — utrata zasiłku za cały okres zwolnienia.',
          '**Spóźniony wniosek** — przedawnienie po 6 miesiącach; brak wniosku o 81,5% w ciągu 21 dni.',
          '**Wniosek o 6. część urlopu rodzicielskiego** — dozwolone jest maks. 5 części.',
        ],
      },
    ],
    links: ['rodzice'],
  },
];
