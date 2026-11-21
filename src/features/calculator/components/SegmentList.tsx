import { View } from 'react-native';

import { AppText } from '@/components/atoms/AppText';
import type { PricedSegment } from '@/domain/calculator/BenefitSimulation';
import { formatDate } from '@/domain/dates/formatDate';
import { useTheme } from '@/theme';
import { formatMoney } from '@/utils/formatMoney';
import { formatPercent } from '@/utils/formatPercent';

import { styles } from './SegmentList.styles';

type Props = { segments: readonly PricedSegment[] };

/** „Zasiłek macierzyński za kolejne urlopy”: kto, jaki urlop, ile tygodni, stopa, od kiedy, kwota/mies. */
export function SegmentList({ segments }: Props) {
  const { colors } = useTheme();

  return (
    <View style={styles.list}>
      <AppText variant="cardTitle">Zasiłek macierzyński za kolejne urlopy</AppText>
      {segments.map((segment, i) => (
        <View key={i} style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.texts}>
            <AppText variant="label">
              {segment.who === 'mother' ? 'Mama' : 'Tata'}: {segment.label}
            </AppText>
            <AppText variant="caption" color={colors.textMuted}>
              {segment.weeks} tyg. · {formatPercent(segment.rate)}
              {segment.factor < 1 ? ` × ${Math.round(segment.factor * 100)}%` : ''} · od {formatDate(segment.from)}
            </AppText>
          </View>
          <AppText variant="label">{formatMoney(segment.monthlyNet, 0)}</AppText>
        </View>
      ))}
    </View>
  );
}
