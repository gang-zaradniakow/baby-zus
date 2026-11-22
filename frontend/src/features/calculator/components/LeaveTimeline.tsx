import { View } from 'react-native';

import { AppText } from '@/components/atoms/AppText';
import { Card } from '@/components/atoms/Card';
import type { Parent, PricedSegment } from '@/domain/calculator/BenefitSimulation';
import { diffDays } from '@/domain/dates/calendarDate';
import { useTheme } from '@/theme';
import { formatPercent } from '@/utils/formatPercent';

import { styles } from './LeaveTimeline.styles';
import { resolveSegmentColors } from './resolveSegmentColors';

type Props = { segments: readonly PricedSegment[] };

const PARENT_LABEL: Record<Parent, string> = { mother: 'Mama', father: 'Tata' };

/**
 * Oś czasu urlopów: wiersz mamy i taty, odcinki proporcjonalne do długości, z datą startu
 * wspólną dla obojga (np. ojcowski równolegle z macierzyńskim). Opis tekstowy dla czytnika ekranu.
 */
export function LeaveTimeline({ segments }: Props) {
  const { colors } = useTheme();
  if (segments.length === 0) return null;

  const start = Math.min(...segments.map((s) => s.from.getTime()));
  const end = Math.max(...segments.map((s) => s.to.getTime()));
  const startDate = new Date(start);
  const span = Math.max(1, diffDays(startDate, new Date(end)) + 1);

  const row = (who: Parent) => {
    const own = segments.filter((s) => s.who === who);
    if (own.length === 0) return null;
    return (
      <View key={who} style={styles.row}>
        <AppText variant="label" style={styles.who}>
          {PARENT_LABEL[who]}
        </AppText>
        <View style={[styles.track, { backgroundColor: colors.track }]}>
          {own.map((segment, i) => {
            const left = (diffDays(startDate, segment.from) / span) * 100;
            const width = Math.max(1.5, ((diffDays(segment.from, segment.to) + 1) / span) * 100);
            const tint = resolveSegmentColors(segment, colors);
            return (
              <View
                key={i}
                style={[styles.segment, { left: `${left}%`, width: `${width}%`, backgroundColor: tint.background }]}
              >
                {width > 12 ? (
                  <AppText variant="badge" color={tint.text} numberOfLines={1}>
                    {formatPercent(segment.rate * segment.factor)}
                  </AppText>
                ) : null}
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const description = segments
    .map((s) => `${PARENT_LABEL[s.who]}: ${s.label}, ${s.weeks} tyg., ${formatPercent(s.rate * s.factor)}`)
    .join('; ');

  return (
    <Card>
      <View accessible accessibilityLabel={`Oś czasu urlopów. ${description}`} style={styles.rows}>
        {row('mother')}
        {row('father')}
      </View>
    </Card>
  );
}
