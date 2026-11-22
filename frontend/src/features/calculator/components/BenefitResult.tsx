import { View } from 'react-native';

import { AppText } from '@/components/atoms/AppText';
import { Accordion } from '@/components/molecules/Accordion';
import { useTheme } from '@/theme';
import { formatMoney } from '@/utils/formatMoney';

import type { BenefitCalculation } from '../computeCalculation';

import { AllowanceCard } from './AllowanceCard';
import { styles } from './calculator.styles';
import { CheckList } from '@/components/molecules/CheckList';
import { LeaveTimeline } from './LeaveTimeline';
import { ResultHero } from './ResultHero';
import { SegmentList } from './SegmentList';

type Props = { result: BenefitCalculation };

/** Wynik zasiłku macierzyńskiego: pierwszy miesiąc na rękę, wyjaśnienia, oś czasu, odcinki, uwagi. */
export function BenefitResult({ result }: Props) {
  const { colors } = useTheme();
  const { simulation, allowance } = result;
  const { segments, notes, totals } = simulation;
  const problems = result.checks.filter((c) => c.level !== 'ok');

  if (segments.length === 0) {
    return (
      <View style={styles.section}>
        {allowance ? (
          <AllowanceCard allowance={allowance} prefix="Mama: " />
        ) : (
          <ResultHero kind="off" label="Zasiłek macierzyński z ZUS" value={formatMoney(0, 0)} />
        )}
        <CheckList checks={problems} />
        {notes.map((note, i) => (
          <AppText key={i} variant="caption" color={colors.textMuted}>
            {note}
          </AppText>
        ))}
      </View>
    );
  }

  const motherSegments = segments.filter((s) => s.who === 'mother');
  const main = motherSegments.length > 0 ? 'mother' : 'father';
  const first = motherSegments[0] ?? segments[0];
  const mainWeeks = segments.filter((s) => s.who === main).reduce((sum, s) => sum + s.weeks, 0);

  return (
    <View style={styles.section}>
      {motherSegments.length === 0 && allowance ? <AllowanceCard allowance={allowance} prefix="Mama: " /> : null}
      <ResultHero
        label={`Zasiłek macierzyński z ZUS · ${main === 'mother' ? 'mama' : 'tata'} · pierwszy miesiąc`}
        value={formatMoney(first.monthlyNet, 0)}
        unit="/mies."
        caption={`na rękę · ${Math.round(mainWeeks * 10) / 10} tyg. zasiłku · razem ${formatMoney(main === 'mother' ? totals.mother : totals.father, 0)}`}
      />
      <CheckList checks={problems} />
      <LeaveTimeline segments={segments} />
      <SegmentList segments={segments} />
      {totals.father > 0 ? (
        <AppText variant="label" style={styles.centered}>
          Razem rodzina: {formatMoney(totals.family, 0)}
        </AppText>
      ) : null}
      {notes.length > 0 ? (
        <Accordion title={`Uwagi (${notes.length})`}>
          {notes.map((note, i) => (
            <AppText key={i} variant="caption">
              {note}
            </AppText>
          ))}
        </Accordion>
      ) : null}
      <AppText variant="caption" color={colors.textMuted} style={styles.centered}>
        Kwoty orientacyjne, na rękę po zaliczce PIT.
      </AppText>
    </View>
  );
}
