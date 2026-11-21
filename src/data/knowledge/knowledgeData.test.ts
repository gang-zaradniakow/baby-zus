import { articleTexts } from '@/domain/knowledge/articleTexts';

import { ARTICLES } from './articles';
import { CHAPTERS } from './chapters';
import { ZUS_LINKS } from './zusLinks';

describe('dane zakładki Wiedza', () => {
  it('7 rozdziałów i 30 artykułów z Poradnika', () => {
    expect(CHAPTERS).toHaveLength(7);
    expect(ARTICLES).toHaveLength(30);
  });

  it('identyfikatory artykułów są unikalne', () => {
    const ids = ARTICLES.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('każdy artykuł należy do istniejącego rozdziału, a każdy rozdział ma artykuły', () => {
    const chapterIds = new Set(CHAPTERS.map((c) => c.id));
    for (const article of ARTICLES) expect(chapterIds).toContain(article.chapterId);
    for (const chapter of CHAPTERS) expect(ARTICLES.some((a) => a.chapterId === chapter.id)).toBe(true);
  });

  it('linki pod artykułami istnieją w ZUS_LINKS', () => {
    for (const article of ARTICLES) {
      for (const link of article.links) expect(ZUS_LINKS[link]).toBeDefined();
    }
  });

  it('treść nie zawiera resztek HTML i każdy artykuł ma treść', () => {
    for (const article of ARTICLES) {
      expect(article.body.length).toBeGreaterThan(0);
      for (const text of articleTexts(article)) expect(text).not.toMatch(/[<>]/);
    }
  });

  it('tabele mają tyle samo komórek w każdym wierszu co nagłówek', () => {
    const tables = ARTICLES.flatMap((a) => a.body).filter((b) => b.type === 'table');
    expect(tables.length).toBeGreaterThan(0);
    for (const table of tables) {
      for (const row of table.rows) expect(row).toHaveLength(table.header.length);
    }
  });
});
