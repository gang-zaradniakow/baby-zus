import type { Article } from '@/domain/knowledge/Article';

/** Rozdział „Zanim zaczniesz” — wygenerowane z prototypu (js/wiedza.js), treść: Poradnik ZUS. */
export const START_ARTICLES: readonly Article[] = [
  {
    id: 'pojecia',
    chapterId: 'start',
    title: 'Objaśnienie pojęć',
    lead: 'Kilka słów, które pojawiają się w każdej sprawie o zasiłek.',
    source: 'Opis wyzwania ZUS; Poradnik, s. 5 i 23',
    body: [
      {
        type: 'glossary',
        entries: [
          {
            term: 'Płatnik składek',
            definition: 'Podmiot, który zgłasza do ubezpieczeń i opłaca składki — najczęściej pracodawca albo zleceniodawca. Przedsiębiorca jest płatnikiem składek za siebie.',
          },
          {
            term: 'Ubezpieczony',
            definition: 'Osoba, za którą opłacane są składki — np. pracownica, zleceniobiorca, przedsiębiorca.',
          },
          {
            term: 'Świadczeniobiorca',
            definition: 'Osoba, która pobiera świadczenie z ZUS, np. zasiłek macierzyński.',
          },
          {
            term: 'Duży i mały płatnik',
            definition: 'Płatnik, który na 30 listopada poprzedniego roku zgłaszał do ubezpieczenia chorobowego **co najmniej 21 osób**, sam ustala i wypłaca zasiłki. Gdy zgłaszał **najwyżej 20 osób**, zasiłki wypłaca ZUS. Przedsiębiorcy zasiłki zawsze wypłaca ZUS.',
          },
          {
            term: 'Podstawa wymiaru zasiłku',
            definition: 'Przeciętne miesięczne wynagrodzenie (przychód) z 12 miesięcy przed zdarzeniem, pomniejszone o 13,71% składek. Od niej liczy się procent zasiłku.',
          },
          {
            term: 'Okres zasiłkowy',
            definition: 'Najdłuższy czas, przez który możesz dostawać wynagrodzenie chorobowe lub zasiłek chorobowy — 182 dni, a w ciąży 270 dni.',
          },
        ],
      },
    ],
    links: ['rodzice'],
  },
  {
    id: 'kontakt',
    chapterId: 'start',
    title: 'Pozostańmy w kontakcie',
    lead: 'W razie wątpliwości co do dokumentów, procedur czy terminu wypłaty — ZUS jest dla Was.',
    source: 'Poradnik, s. 6 i 39',
    body: [
      {
        type: 'list',
        ordered: false,
        items: [
          'e-mail dla rodziców: **mama@zus.pl**,',
          'infolinia: **22 560 16 00**, e-mail: cot@zus.pl,',
          '**e-wizyta** — rozmowa wideo z ekspertem ZUS,',
          'portal eZUS i aplikacja mobilna mZUS,',
          'każda placówka ZUS.',
        ],
      },
    ],
    links: ['ewizyta', 'rodzice'],
  },
];
