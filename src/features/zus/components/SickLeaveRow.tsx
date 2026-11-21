import { FileText } from 'lucide-react-native';
import { View } from 'react-native';

import { AppText } from '@/components/atoms/AppText';
import { Badge } from '@/components/atoms/Badge';
import { IconCircle } from '@/components/atoms/IconCircle';
import { formatDate } from '@/domain/dates/formatDate';
import type { SickLeaveCertificate } from '@/domain/zus/ZusAccount';
import { useTheme } from '@/theme';

import { styles } from './zusRows.styles';

type Props = { certificate: SickLeaveCertificate };

/** Zaświadczenie e-ZLA: okres, numer, kod (B = ciąża, 100%), wskazanie i status wypłaty. */
export function SickLeaveRow({ certificate }: Props) {
  const { colors } = useTheme();
  const code = certificate.code === 'B' ? 'kod B (ciąża — 100%)' : `kod ${certificate.code}`;

  return (
    <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <IconCircle icon={FileText} tone="accent" />
      <View style={styles.texts}>
        <AppText variant="label">
          {formatDate(certificate.from)} – {formatDate(certificate.to)}
        </AppText>
        <AppText variant="caption" color={colors.textMuted}>
          {certificate.number} · {code} · {certificate.indication}
        </AppText>
        <View style={styles.badges}>
          <Badge label={certificate.status} tone="info" />
        </View>
      </View>
    </View>
  );
}
