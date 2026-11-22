import { router, useLocalSearchParams } from 'expo-router';

import { ScreenLayout } from '@/components/templates/ScreenLayout';
import { ARTICLES } from '@/data/knowledge/articles';
import { CHAPTERS } from '@/data/knowledge/chapters';
import { chapterArticles } from '@/domain/knowledge/chapterArticles';
import { ArticleList } from '@/features/knowledge/components/ArticleList';
import { knowledgeRoutes } from '@/features/knowledge/knowledgeRoutes';

/** Rozdział Poradnika: krótki opis i lista artykułów. */
export function ChapterScreen() {
  const { chapterId } = useLocalSearchParams<{ chapterId: string }>();
  const chapter = CHAPTERS.find((c) => c.id === chapterId);
  const goBack = () => router.dismissTo(knowledgeRoutes.home);

  if (!chapter) {
    return (
      <ScreenLayout
        title="Nie ma takiego rozdziału"
        subtitle="Wróć do listy rozdziałów."
        onBack={goBack}
        backLabel="Wiedza"
      />
    );
  }

  return (
    <ScreenLayout title={chapter.title} subtitle={chapter.lead} onBack={goBack} backLabel="Wiedza">
      <ArticleList
        articles={chapterArticles(ARTICLES, chapter.id)}
        onSelect={(article) => router.push(knowledgeRoutes.article(article.id))}
      />
    </ScreenLayout>
  );
}
