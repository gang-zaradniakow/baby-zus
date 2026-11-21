import { CircleCheck, Info, TriangleAlert } from 'lucide-react-native';
import { View } from 'react-native';

import { AppText } from '@/components/atoms/AppText';
import type { CalcCheck } from '@/domain/calculator/CalcCheck';
import { useTheme } from '@/theme';

import { styles } from './CheckList.styles';

type Props = { checks: readonly CalcCheck[] };

const LEVEL_LABEL: Record<CalcCheck['level'], string> = { ok: 'Spełnione', info: 'Informacja', no: 'Uwaga' };

/** Wyjaśnienia kalkulatora z ikoną: ✓ spełnione, ⓘ dobrze wiedzieć, ⚠ coś blokuje. */
export function CheckList({ checks }: Props) {
  const { colors } = useTheme();
  if (checks.length === 0) return null;

  const visuals = {
    ok: { Icon: CircleCheck, color: colors.primary },
    info: { Icon: Info, color: colors.info },
    no: { Icon: TriangleAlert, color: colors.danger },
  };

  return (
    <View style={styles.list}>
      {checks.map((check, i) => {
        const { Icon, color } = visuals[check.level];
        return (
          <View
            key={i}
            accessible
            accessibilityLabel={`${LEVEL_LABEL[check.level]}: ${check.text}`}
            style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Icon color={color} size={20} />
            <AppText variant="caption" style={styles.text}>
              {check.text}
            </AppText>
          </View>
        );
      })}
    </View>
  );
}
