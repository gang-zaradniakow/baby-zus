import { View } from 'react-native';

import { LinkRow } from '@/components/molecules/LinkRow';
import { ARTICLES } from '@/data/knowledge/articles';
import type { ChapterEntry } from '@/data/knowledge/chapters';
import { chapterArticles } from '@/domain/knowledge/chapterArticles';
import { pluralizePl } from '@/utils/pluralizePl';

import { styles } from './knowledgeList.styles';

type Props = {
  chapters: readonly ChapterEntry[];
  onSelect: (chapter: ChapterEntry) => void;
};

/** Rozdziały Poradnika z ikoną i liczbą artykułów. */
export function ChapterList({ chapters, onSelect }: Props) {
  return (
    <View style={styles.list}>
      {chapters.map((chapter) => (
        <LinkRow
          key={chapter.id}
          icon={chapter.icon}
          tone={chapter.tone}
          title={chapter.title}
          subtitle={pluralizePl(chapterArticles(ARTICLES, chapter.id).length, 'artykuł', 'artykuły', 'artykułów')}
          onPress={() => onSelect(chapter)}
        />
      ))}
    </View>
  );
}
