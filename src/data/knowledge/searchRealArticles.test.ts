import { searchArticles } from '@/domain/knowledge/searchArticles';

import { ARTICLES } from './articles';

const ids = (query: string) => searchArticles(ARTICLES, query).map((a) => a.id);

describe('wyszukiwanie w prawdziwej treści Poradnika', () => {
  it('„kod B” prowadzi do zwolnienia w ciąży', () => {
    expect(ids('kod B')).toContain('l4-ciaza');
  });

  it('„Z-3” nie zwraca wszystkiego, tylko artykuły o zaświadczeniu Z-3', () => {
    const result = ids('Z-3');
    expect(result).toContain('jak-mac');
    expect(result.length).toBeLessThan(ARTICLES.length / 2);
  });

  it('„urlop ojcowski” zaczyna się od artykułu o urlopie ojcowskim', () => {
    expect(ids('urlop ojcowski')[0]).toBe('ojcowski');
  });
});
