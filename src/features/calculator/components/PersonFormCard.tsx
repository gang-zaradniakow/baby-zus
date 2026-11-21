import { View } from 'react-native';

import { AppText } from '@/components/atoms/AppText';
import { Card } from '@/components/atoms/Card';
import { TextButton } from '@/components/atoms/TextButton';
import { CheckboxRow } from '@/components/molecules/CheckboxRow';
import { NumberField } from '@/components/molecules/NumberField';
import { ToggleChip } from '@/components/molecules/ToggleChip';
import { useLegalParams } from '@/params';
import { useTheme } from '@/theme';
import { formatMoney } from '@/utils/formatMoney';

import type { PersonForm } from '../CalculatorForm';
import { hasNoTitles, patchTitle, patchZ3Month, toggleTitle, type TitleChipId } from '../personForm';
import type { ResolvedPersonForm } from '../resolvePersonForm';

import { styles } from './calculator.styles';
import { Z3MonthsGrid } from './Z3MonthsGrid';

type Props = {
  title: string;
  person: PersonForm;
  resolved: ResolvedPersonForm;
  onUpdate: (update: (person: PersonForm) => PersonForm) => void;
};

const TITLE_CHIPS: readonly { id: Exclude<TitleChipId, 'none'>; label: string }[] = [
  { id: 'uop', label: 'Etat' },
  { id: 'zlec', label: 'Zlecenie' },
  { id: 'jdg', label: 'Firma' },
  { id: 'krus', label: 'Rolnik (KRUS)' },
];

/** Karta osoby: jak pracuje (kilka tytułów naraz) i podstawa z każdego tytułu — jak `personForm` w prototypie. */
export function PersonFormCard({ title, person, resolved, onUpdate }: Props) {
  const { colors } = useTheme();
  const { params } = useLegalParams();
  const { uop, zlec, jdg } = person.titles;

  return (
    <Card title={title}>
      <AppText variant="caption" color={colors.textMuted}>
        Jak pracuje? (można kilka)
      </AppText>
      <View style={styles.chips}>
        {TITLE_CHIPS.map((chip) => (
          <ToggleChip
            key={chip.id}
            label={chip.label}
            selected={person.titles[chip.id].on}
            onPress={() => onUpdate((p) => toggleTitle(p, chip.id))}
          />
        ))}
        <ToggleChip label="Nie pracuje" selected={hasNoTitles(person)} onPress={() => onUpdate((p) => toggleTitle(p, 'none'))} />
      </View>

      {uop.on ? (
        <View style={styles.title}>
          <AppText variant="label">Etat</AppText>
          {person.useZ3 ? (
            <>
              <Z3MonthsGrid months={person.months} onChange={(i, patch) => onUpdate((p) => patchZ3Month(p, i, patch))} />
              {resolved.z3 ? (
                <AppText variant="caption" color={colors.textMuted}>
                  {resolved.z3.monthsUsed ? `Podstawa: ${formatMoney(resolved.z3.base)}. ${resolved.z3.note}` : resolved.z3.note}
                </AppText>
              ) : null}
              <TextButton title="Wpisz podstawę ręcznie" onPress={() => onUpdate((p) => ({ ...p, useZ3: false }))} />
            </>
          ) : (
            <>
              <NumberField
                label="Podstawa (zł / mies.)"
                unit="zł"
                value={uop.base}
                hint="Średnie brutto z 12 mies. minus 13,71%."
                onChange={(base) => onUpdate((p) => patchTitle(p, 'uop', { base }))}
              />
              <TextButton title="Policz z Z-3" onPress={() => onUpdate((p) => ({ ...p, useZ3: true }))} />
            </>
          )}
          <CheckboxRow
            label={`Co najmniej płaca minimalna (${formatMoney(params.minWage, 0)} brutto)`}
            checked={uop.atLeastMinWage}
            onToggle={() => onUpdate((p) => patchTitle(p, 'uop', { atLeastMinWage: !uop.atLeastMinWage }))}
          />
        </View>
      ) : null}

      {zlec.on ? (
        <View style={styles.title}>
          <AppText variant="label">Zlecenie</AppText>
          <CheckboxRow
            label="Student / uczeń do 26 lat"
            checked={zlec.student}
            onToggle={() => onUpdate((p) => patchTitle(p, 'zlec', { student: !zlec.student }))}
          />
          {!zlec.student ? (
            <>
              <NumberField
                label="Podstawa zlecenia (zł / mies.)"
                unit="zł"
                value={zlec.base}
                onChange={(base) => onUpdate((p) => patchTitle(p, 'zlec', { base }))}
              />
              <CheckboxRow
                label="Dobrowolne chorobowe na zleceniu"
                checked={zlec.voluntarySickness}
                onToggle={() => onUpdate((p) => patchTitle(p, 'zlec', { voluntarySickness: !zlec.voluntarySickness }))}
              />
            </>
          ) : null}
        </View>
      ) : null}

      {jdg.on ? (
        <View style={styles.title}>
          <AppText variant="label">Firma</AppText>
          <CheckboxRow
            label="Ulga na start (pierwsze 6 mies.)"
            checked={jdg.startRelief}
            onToggle={() => onUpdate((p) => patchTitle(p, 'jdg', { startRelief: !jdg.startRelief }))}
          />
          {!jdg.startRelief ? (
            <>
              <NumberField
                label="Podstawa składek minus 13,71% (zł / mies.)"
                unit="zł"
                value={jdg.base}
                onChange={(base) => onUpdate((p) => patchTitle(p, 'jdg', { base }))}
              />
              <CheckboxRow
                label="Dobrowolne chorobowe w firmie"
                checked={jdg.voluntarySickness}
                onToggle={() => onUpdate((p) => patchTitle(p, 'jdg', { voluntarySickness: !jdg.voluntarySickness }))}
              />
              <NumberField
                label="Zaległość w składkach (zł)"
                unit="zł"
                value={jdg.debt}
                onChange={(debt) => onUpdate((p) => patchTitle(p, 'jdg', { debt }))}
              />
            </>
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}
