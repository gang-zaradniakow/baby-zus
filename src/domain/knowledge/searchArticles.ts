import { normalizeSearchText } from '@/utils/normalizeSearchText';
import { stemSearchWord } from '@/utils/stemSearchWord';

import type { Article } from './Article';
import { articleTexts } from './articleTexts';

/** Krótsze zapytanie nic nie szuka — przy jednej literze wyników byłoby za dużo. */
export const MIN_QUERY_LENGTH = 2;

/**
 * Artykuły zawierające wszystkie słowa z zapytania (bez ogonków i wielkości liter, z uciętą
 * końcówką odmiany — „zasiłek” znajdzie „zasiłku”).
 * Najpierw te, w których słowa są w tytule, potem reszta — w kolejności Poradnika.
 */
export function searchArticles(articles: readonly Article[], query: string): Article[] {
  const normalized = normalizeSearchText(query);
  if (normalized.length < MIN_QUERY_LENGTH) return [];

  const words = normalized.split(' ').map(stemSearchWord);
  const containsAll = (text: string) => words.every((word) => text.includes(word));

  const hits = articles.filter((article) => containsAll(normalizeSearchText(articleTexts(article).join(' '))));
  const inTitle = hits.filter((article) => containsAll(normalizeSearchText(article.title)));
  return [...inTitle, ...hits.filter((article) => !inTitle.includes(article))];
}
