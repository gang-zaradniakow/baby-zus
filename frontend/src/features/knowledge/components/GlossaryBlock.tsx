import { View } from 'react-native';

import { AppText } from '@/components/atoms/AppText';
import { RichText } from '@/components/atoms/RichText';
import type { GlossaryEntry } from '@/domain/knowledge/Article';
import { useTheme } from '@/theme';

import { styles } from './GlossaryBlock.styles';

type Props = { entries: readonly GlossaryEntry[] };

/** Słowniczek: pojęcie pogrubione, pod nim wyjaśnienie. */
export function GlossaryBlock({ entries }: Props) {
  const { colors } = useTheme();

  return (
    <View style={styles.list}>
      {entries.map((entry) => (
        <View key={entry.term} style={[styles.entry, { borderLeftColor: colors.primary }]}>
          <AppText variant="label">{entry.term}</AppText>
          <RichText text={entry.definition} color={colors.textMuted} />
        </View>
      ))}
    </View>
  );
}
