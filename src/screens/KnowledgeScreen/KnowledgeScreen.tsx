import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/atoms/AppText';
import { TextButton } from '@/components/atoms/TextButton';
import { SearchField } from '@/components/molecules/SearchField';
import { ScreenLayout } from '@/components/templates/ScreenLayout';
import { ARTICLES } from '@/data/knowledge/articles';
import { CHAPTERS } from '@/data/knowledge/chapters';
import { MIN_QUERY_LENGTH, searchArticles } from '@/domain/knowledge/searchArticles';
import { assistantHref } from '@/features/assistant/assistantHref';
import { ArticleList } from '@/features/knowledge/components/ArticleList';
import { ChapterList } from '@/features/knowledge/components/ChapterList';
import { knowledgeRoutes } from '@/features/knowledge/knowledgeRoutes';
import { useTheme } from '@/theme';

import { styles } from './KnowledgeScreen.styles';

/** Zakładka „Wiedza”: wyszukiwarka i rozdziały Poradnika ZUS. */
export function KnowledgeScreen() {
  const { colors } = useTheme();
  const [query, setQuery] = useState('');
  const isSearching = query.trim().length >= MIN_QUERY_LENGTH;
  const results = isSearching ? searchArticles(ARTICLES, query) : [];

  return (
    <ScreenLayout title="Wiedza" subtitle="Poradnik ZUS dla rodziców — rozdział po rozdziale.">
      <View style={styles.content}>
        <SearchField
          label="Szukaj w poradniku"
          placeholder="Szukaj, np. kod B, Z-3, urlop ojcowski"
          value={query}
          onChangeText={setQuery}
        />

        {!isSearching ? (
          <ChapterList chapters={CHAPTERS} onSelect={(chapter) => router.push(knowledgeRoutes.chapter(chapter.id))} />
        ) : results.length > 0 ? (
          <ArticleList articles={results} onSelect={(article) => router.push(knowledgeRoutes.article(article.id))} />
        ) : (
          <View style={styles.empty}>
            <AppText color={colors.textMuted} accessibilityLiveRegion="polite">
              Nic nie znaleźliśmy. Spróbuj innego słowa, np. „zasiłek” albo „urlop”.
            </AppText>
            <TextButton title="Zapytaj asystenta" onPress={() => router.navigate(assistantHref(query))} />
          </View>
        )}
      </View>
    </ScreenLayout>
  );
}
