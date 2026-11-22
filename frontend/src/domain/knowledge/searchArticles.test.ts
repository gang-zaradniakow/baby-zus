import type { Article } from './Article';
import { searchArticles } from './searchArticles';

function article(id: string, title: string, text: string): Article {
  return {
    id,
    chapterId: 'po',
    title,
    lead: '',
    source: 'Poradnik',
    body: [{ type: 'paragraph', text }],
    links: [],
  };
}

const ARTICLES = [
  article('a', 'Zwolnienie w ciąży', 'Zasiłek z **kodem B** wynosi 100% podstawy.'),
  article('b', 'Zasiłek macierzyński', 'Wniosek składasz u pracodawcy.'),
  article('c', 'Urlop ojcowski', 'Tata ma 2 tygodnie, zasiłek macierzyński 100%.'),
];

const ids = (result: Article[]) => result.map((a) => a.id);

describe('searchArticles', () => {
  it('za krótkie zapytanie nic nie zwraca', () => {
    expect(searchArticles(ARTICLES, 'z')).toEqual([]);
    expect(searchArticles(ARTICLES, '   ')).toEqual([]);
  });

  it('szuka bez ogonków i wielkich liter, także w treści', () => {
    expect(ids(searchArticles(ARTICLES, 'KOD b'))).toEqual(['a']);
    expect(ids(searchArticles(ARTICLES, 'ciaza'))).toEqual(['a']);
  });

  it('radzi sobie z odmianą: „zasiłek” znajduje „zasiłku”', () => {
    const withCase = [article('d', 'Wysokość', 'Podstawa zasiłku chorobowego.')];
    expect(ids(searchArticles(withCase, 'zasiłek chorobowy'))).toEqual(['d']);
  });

  it('wymaga wszystkich słów, w dowolnej kolejności', () => {
    expect(ids(searchArticles(ARTICLES, 'macierzynski tata'))).toEqual(['c']);
    expect(ids(searchArticles(ARTICLES, 'tata pracodawca'))).toEqual([]);
  });

  it('trafienia w tytule są pierwsze', () => {
    expect(ids(searchArticles(ARTICLES, 'zasilek macierzynski'))).toEqual(['b', 'c']);
  });
});
