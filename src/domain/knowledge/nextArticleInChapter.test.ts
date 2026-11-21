import type { Article, ChapterId } from './Article';
import { chapterArticles } from './chapterArticles';
import { nextArticleInChapter } from './nextArticleInChapter';

const make = (id: string, chapterId: ChapterId): Article => ({
  id,
  chapterId,
  title: id,
  lead: '',
  source: '',
  body: [],
  links: [],
});

const ARTICLES = [make('a', 'ciaza'), make('b', 'po'), make('c', 'ciaza'), make('d', 'ciaza')];

describe('chapterArticles', () => {
  it('zwraca artykuły rozdziału w kolejności', () => {
    expect(chapterArticles(ARTICLES, 'ciaza').map((a) => a.id)).toEqual(['a', 'c', 'd']);
    expect(chapterArticles(ARTICLES, 'ryzyka')).toEqual([]);
  });
});

describe('nextArticleInChapter', () => {
  it('pomija artykuły z innych rozdziałów', () => {
    expect(nextArticleInChapter(ARTICLES, ARTICLES[0])?.id).toBe('c');
  });

  it('na końcu rozdziału zwraca null', () => {
    expect(nextArticleInChapter(ARTICLES, ARTICLES[3])).toBeNull();
    expect(nextArticleInChapter(ARTICLES, ARTICLES[1])).toBeNull();
  });
});
