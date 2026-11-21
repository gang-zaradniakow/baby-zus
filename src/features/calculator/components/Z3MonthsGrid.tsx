import { Pressable, View } from 'react-native';

import { AppText } from '@/components/atoms/AppText';
import { Checkbox } from '@/components/atoms/Checkbox';
import { NumberField } from '@/components/molecules/NumberField';
import type { Z3Month } from '@/domain/calculator/resolveZ3Base';
import { useTheme } from '@/theme';

import { styles } from './calculator.styles';

type Props = {
  months: readonly Z3Month[];
  onChange: (index: number, patch: Partial<Z3Month>) => void;
};

/** Siatka 12 miesięcy z zaświadczenia Z-3: brutto + „pomiń” (mniej niż pół miesiąca pracy). */
export function Z3MonthsGrid({ months, onChange }: Props) {
  const { colors } = useTheme();

  return (
    <View style={styles.section}>
      <AppText variant="label">Brutto z 12 miesięcy (Z-3)</AppText>
      <View style={styles.grid}>
        {months.map((month, i) => (
          <View key={i} style={styles.gridCell}>
            <NumberField
              compact
              label={`${i + 1}. miesiąc`}
              placeholder="zł"
              value={month.amount}
              onChange={(amount) => onChange(i, { amount })}
            />
            <Pressable
              onPress={() => onChange(i, { skip: !month.skip })}
              accessibilityRole="checkbox"
              accessibilityLabel={`Pomiń ${i + 1}. miesiąc`}
              accessibilityState={{ checked: month.skip }}
              style={styles.row}
            >
              <Checkbox checked={month.skip} />
              <AppText variant="caption">pomiń</AppText>
            </Pressable>
          </View>
        ))}
      </View>
      <AppText variant="caption" color={colors.textMuted}>
        „Pomiń” = przepracowano mniej niż połowę miesiąca.
      </AppText>
    </View>
  );
}
