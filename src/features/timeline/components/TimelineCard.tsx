import { CalendarDays } from 'lucide-react-native';
import { View } from 'react-native';

import { AppText } from '@/components/atoms/AppText';
import { Badge } from '@/components/atoms/Badge';
import { INSTITUTIONS } from '@/data/institutions';
import { formatDeadline } from '@/domain/timeline/formatDeadline';
import type { TimelineItem } from '@/domain/timeline/TimelineItem';
import { resolveTone, useTheme } from '@/theme';

import type { TimelineVisuals } from '../resolveTimelineVisuals';

import { styles } from './TimelineCard.styles';

type Props = {
  item: TimelineItem;
  visuals: TimelineVisuals;
};

/** Karta pozycji osi czasu: odznaki (instytucja, status), tytuł, opis, termin. */
export function TimelineCard({ item, visuals }: Props) {
  const { colors } = useTheme();
  const { main } = resolveTone(visuals.tone, colors);
  const institution = INSTITUTIONS[item.institution];

  const emphasisStyle =
    visuals.emphasis === 'strong'
      ? [styles.strong, { borderColor: main, backgroundColor: colors.surface }]
      : visuals.emphasis === 'dashed'
        ? [styles.dashed, { borderColor: colors.borderStrong }]
        : [styles.normal, { borderColor: colors.border, backgroundColor: colors.surface }];

  return (
    <View style={[styles.card, emphasisStyle, visuals.dimmed && styles.dimmed]}>
      <View style={styles.badges}>
        <Badge label={institution.label} tone={institution.tone} />
        {visuals.statusLabel ? <Badge label={visuals.statusLabel} tone={visuals.tone} /> : null}
      </View>

      <AppText
        variant="cardTitle"
        color={visuals.emphasis === 'dashed' ? colors.textMuted : colors.textPrimary}
        style={item.status === 'done' ? styles.doneTitle : undefined}
      >
        {item.title}
      </AppText>

      {item.description ? (
        <AppText variant="caption" color={colors.textMuted}>
          {item.description}
        </AppText>
      ) : null}

      <View style={styles.dateRow}>
        <CalendarDays color={colors.textMuted} size={14} />
        <AppText variant="caption" color={colors.textMuted} style={styles.dateText}>
          {formatDeadline(item)}
        </AppText>
      </View>
    </View>
  );
}
