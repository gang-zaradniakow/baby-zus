import { Briefcase } from 'lucide-react-native';
import { View } from 'react-native';

import { AppText } from '@/components/atoms/AppText';
import { Badge } from '@/components/atoms/Badge';
import { IconCircle } from '@/components/atoms/IconCircle';
import { fromISODate } from '@/domain/dates/calendarDate';
import { formatDate } from '@/domain/dates/formatDate';
import type { SicknessInsurance, ZusTitle } from '@/domain/zus/ZusAccount';
import { useTheme, type Tone } from '@/theme';
import { formatMoney } from '@/utils/formatMoney';

import { styles } from './zusRows.styles';

const SICKNESS_BADGE: Record<SicknessInsurance, { label: string; tone: Tone }> = {
  mandatory: { label: 'chorobowe obowiązkowe', tone: 'primary' },
  voluntary: { label: 'chorobowe dobrowolne', tone: 'primary' },
  krus: { label: 'KRUS', tone: 'accent' },
  none: { label: 'bez chorobowego', tone: 'danger' },
};

type Props = { title: ZusTitle };

/** Tytuł ubezpieczenia z eZUS: nazwa, płatnik, od kiedy, podstawa składek i status chorobowego. */
export function ZusTitleRow({ title }: Props) {
  const { colors } = useTheme();
  const badge = SICKNESS_BADGE[title.sickness];
  const base = title.contributionBase ? ` · podstawa składek ${formatMoney(title.contributionBase)}` : '';

  return (
    <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <IconCircle icon={Briefcase} tone="info" />
      <View style={styles.texts}>
        <AppText variant="label">{title.name}</AppText>
        <AppText variant="caption" color={colors.textMuted}>
          {title.payer} · od {formatDate(fromISODate(title.since))}
          {base}
        </AppText>
        <View style={styles.badges}>
          <Badge label={badge.label} tone={badge.tone} />
        </View>
      </View>
    </View>
  );
}
