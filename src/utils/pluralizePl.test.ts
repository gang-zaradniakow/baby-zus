import { pluralizePl } from './pluralizePl';

const articles = (n: number) => pluralizePl(n, 'artykuł', 'artykuły', 'artykułów');

describe('pluralizePl', () => {
  it('1 — forma pojedyncza', () => {
    expect(articles(1)).toBe('1 artykuł');
  });

  it('2–4 i 22–24 — „artykuły”', () => {
    expect(articles(3)).toBe('3 artykuły');
    expect(articles(22)).toBe('22 artykuły');
  });

  it('0, 5+, 12–14 — „artykułów”', () => {
    expect(articles(0)).toBe('0 artykułów');
    expect(articles(5)).toBe('5 artykułów');
    expect(articles(12)).toBe('12 artykułów');
  });
});
