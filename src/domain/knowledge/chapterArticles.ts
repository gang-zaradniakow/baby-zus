import type { Article, ChapterId } from './Article';

/** Artykuły jednego rozdziału, w kolejności Poradnika. */
export function chapterArticles(articles: readonly Article[], chapterId: ChapterId): Article[] {
  return articles.filter((article) => article.chapterId === chapterId);
}
