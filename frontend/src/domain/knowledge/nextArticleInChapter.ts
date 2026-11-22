import type { Article } from './Article';
import { chapterArticles } from './chapterArticles';

/** Następny artykuł w tym samym rozdziale (link „Dalej” pod artykułem); `null` na końcu rozdziału. */
export function nextArticleInChapter(articles: readonly Article[], current: Article): Article | null {
  const siblings = chapterArticles(articles, current.chapterId);
  const index = siblings.findIndex((article) => article.id === current.id);
  return siblings[index + 1] ?? null;
}
