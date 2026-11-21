import { View } from 'react-native';

import { LinkRow } from '@/components/molecules/LinkRow';
import type { Article } from '@/domain/knowledge/Article';

import { styles } from './knowledgeList.styles';

type Props = {
  articles: readonly Article[];
  onSelect: (article: Article) => void;
};

/** Lista artykułów (tytuł + lead) — w rozdziale i w wynikach wyszukiwania. */
export function ArticleList({ articles, onSelect }: Props) {
  return (
    <View style={styles.list}>
      {articles.map((article) => (
        <LinkRow key={article.id} title={article.title} subtitle={article.lead} onPress={() => onSelect(article)} />
      ))}
    </View>
  );
}
