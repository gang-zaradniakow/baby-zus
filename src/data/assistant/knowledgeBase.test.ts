import { ARTICLES } from '@/data/knowledge/articles';
import { findWizard } from '@/data/wizards';
import { articleTexts } from '@/domain/knowledge/articleTexts';

import { KNOWLEDGE_BASE } from './knowledgeBase';

/** Trasy poza artykułami Wiedzy, do których mogą prowadzić przyciski pod odpowiedzią. */
const KNOWN_ROUTES = [
  '/wiedza',
  '/kalkulator',
  '/wiecej/kontakt',
  '/wiecej/wsparcie',
  '/wiecej/wiadomosci',
  '/wiecej/strata',
  '/wiecej/wnioski',
];

describe('baza wiedzy Asystenta', () => {
  it('51 wpisów z prototypu, unikalne id, każdy ze źródłem i odpowiedzią', () => {
    expect(KNOWLEDGE_BASE).toHaveLength(51);
    expect(new Set(KNOWLEDGE_BASE.map((e) => e.id)).size).toBe(51);
    for (const entry of KNOWLEDGE_BASE) {
      expect(entry.source).not.toBe('');
      expect(entry.answer.length).toBeGreaterThan(0);
    }
  });

  it('przyciski prowadzą do istniejących artykułów, kreatorów albo znanych ekranów', () => {
    const articleIds = new Set(ARTICLES.map((a) => a.id));
    for (const { href } of KNOWLEDGE_BASE.flatMap((e) => e.actions)) {
      const article = href.match(/^\/wiedza\/artykul\/(.+)$/);
      const wizard = href.match(/^\/wiecej\/wniosek\/(.+)$/);
      if (article) expect(articleIds).toContain(article[1]);
      else if (wizard) expect(findWizard(wizard[1])).not.toBeNull();
      else expect(KNOWN_ROUTES).toContain(href);
    }
  });

  it('odpowiedzi bez resztek HTML', () => {
    for (const entry of KNOWLEDGE_BASE) {
      const asArticle = { ...entry, chapterId: 'start' as const, title: entry.question, lead: '', body: entry.answer, links: [] };
      for (const text of articleTexts(asArticle)) expect(text).not.toMatch(/<\/?[a-z]/i);
    }
  });
});
