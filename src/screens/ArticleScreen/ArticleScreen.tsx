import * as Linking from 'expo-linking';
import { router, useLocalSearchParams } from 'expo-router';
import { Calculator } from 'lucide-react-native';
import { View } from 'react-native';

import { AppText } from '@/components/atoms/AppText';
import { Button } from '@/components/atoms/Button';
import { LinkRow } from '@/components/molecules/LinkRow';
import { ScreenLayout } from '@/components/templates/ScreenLayout';
import { ARTICLES } from '@/data/knowledge/articles';
import { CHAPTERS } from '@/data/knowledge/chapters';
import { ZUS_LINKS } from '@/data/knowledge/zusLinks';
import { nextArticleInChapter } from '@/domain/knowledge/nextArticleInChapter';
import { ArticleBlockView } from '@/features/knowledge/components/ArticleBlockView';
import { knowledgeRoutes } from '@/features/knowledge/knowledgeRoutes';
import { useTheme } from '@/theme';

import { styles } from './ArticleScreen.styles';

/** Artykuł Poradnika: treść w blokach, „Policz”, linki do zus.pl, źródło i „Dalej”. */
export function ArticleScreen() {
  const { colors } = useTheme();
  const { articleId } = useLocalSearchParams<{ articleId: string }>();
  const article = ARTICLES.find((a) => a.id === articleId);

  if (!article) {
    return (
      <ScreenLayout
        title="Nie ma takiego artykułu"
        subtitle="Mógł zostać przeniesiony. Poszukaj go w zakładce Wiedza."
        onBack={() => router.dismissTo(knowledgeRoutes.home)}
        backLabel="Wiedza"
      />
    );
  }

  const chapter = CHAPTERS.find((c) => c.id === article.chapterId);
  const next = nextArticleInChapter(ARTICLES, article);

  return (
    <ScreenLayout
      title={article.title}
      subtitle={article.lead}
      onBack={() => router.dismissTo(knowledgeRoutes.chapter(article.chapterId))}
      backLabel={chapter?.title}
    >
      <View style={styles.content}>
        <View style={styles.body}>
          {article.body.map((block, i) => (
            <ArticleBlockView key={i} block={block} />
          ))}
        </View>

        {article.calculator ? (
          <Button title="Policz w kalkulatorze" icon={Calculator} onPress={() => router.navigate('/kalkulator')} />
        ) : null}

        {article.links.length > 0 ? (
          <View style={styles.links}>
            {article.links.map((id) => (
              <LinkRow
                key={id}
                role="link"
                title={ZUS_LINKS[id].label}
                onPress={() => Linking.openURL(ZUS_LINKS[id].url)}
              />
            ))}
          </View>
        ) : null}

        <AppText variant="caption" color={colors.textMuted}>
          Źródło: {article.source}
        </AppText>

        {next ? (
          <LinkRow
            title={next.title}
            subtitle="Następny artykuł w rozdziale"
            onPress={() => router.replace(knowledgeRoutes.article(next.id))}
          />
        ) : null}
      </View>
    </ScreenLayout>
  );
}
