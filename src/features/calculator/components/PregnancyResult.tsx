import { View } from 'react-native';

import { AppText } from '@/components/atoms/AppText';
import { toNetAmount } from '@/domain/calculator/toNetAmount';
import { useTheme } from '@/theme';
import { formatMoney } from '@/utils/formatMoney';
import { formatPercent } from '@/utils/formatPercent';

import type { PregnancyCalculation } from '../computeCalculation';

import { AllowanceCard } from './AllowanceCard';
import { styles } from './calculator.styles';
import { CheckList } from './CheckList';
import { ResultHero } from './ResultHero';
import { styles as rowStyles } from './SegmentList.styles';

type Props = {
  result: PregnancyCalculation;
  days: number;
};

/** Wynik L4 w ciąży: kwota na rękę, wyjaśnienia i rozbicie (pracodawca / zasiłek / rehabilitacyjne). */
export function PregnancyResult({ result, days }: Props) {
  const { colors } = useTheme();
  const { sickPay, checks, allowance, mother } = result;

  if (sickPay.parts.length === 0) {
    return (
      <View style={styles.section}>
        <ResultHero
          kind="off"
          label="Zasiłek chorobowy w ciąży z ZUS"
          value="nie przysługuje"
          caption={
            mother.resolution.krus
              ? 'Rolniczka w KRUS — zasiłek chorobowy wypłaca KRUS na własnych zasadach.'
              : 'Bez ubezpieczenia chorobowego w ZUS nie ma zasiłku za L4.'
          }
        />
        <CheckList checks={checks} />
        {allowance ? <AllowanceCard allowance={allowance} prefix="Po porodzie: " /> : null}
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <ResultHero
        label={`Zasiłek chorobowy w ciąży · ${days} dni L4 · 100%`}
        value={formatMoney(toNetAmount(sickPay.total), 0)}
        caption={`na rękę · ${formatMoney(sickPay.total, 0)} brutto`}
      />
      <CheckList checks={checks} />
      {sickPay.parts.map((part, i) => (
        <View key={i} style={[rowStyles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={rowStyles.texts}>
            <AppText variant="label">{part.label}</AppText>
            <AppText variant="caption" color={colors.textMuted}>
              {part.days} dni · {formatPercent(part.rate)}
            </AppText>
          </View>
          <AppText variant="label">{formatMoney(part.amount, 0)}</AppText>
        </View>
      ))}
    </View>
  );
}
