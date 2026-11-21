import { View } from 'react-native';

import { AppText } from '@/components/atoms/AppText';
import type { TimelineItem } from '@/domain/timeline/TimelineItem';
import { useTheme } from '@/theme';

import { styles } from './Timeline.styles';
import { TimelineRow } from './TimelineRow';

type Props = {
  items: readonly TimelineItem[];
  onToggleTask: (id: string) => void;
};

/** Pionowa oś czasu: linia w tle + wiersze z kropkami i kartami. */
export function Timeline({ items, onToggleTask }: Props) {
  const { colors } = useTheme();

  if (items.length === 0) {
    return (
      <AppText variant="body" color={colors.textMuted}>
        Brak zadań do pokazania.
      </AppText>
    );
  }

  return (
    <View style={styles.timeline} accessibilityRole="list">
      <View style={[styles.line, { backgroundColor: colors.track }]} />
      {items.map((item) => (
        <TimelineRow key={item.id} item={item} onToggle={onToggleTask} />
      ))}
    </View>
  );
}
