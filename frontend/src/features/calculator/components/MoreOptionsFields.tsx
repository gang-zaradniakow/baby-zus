import { View } from 'react-native';

import { CheckboxRow } from '@/components/molecules/CheckboxRow';
import { NumberField } from '@/components/molecules/NumberField';
import { SegmentedControl } from '@/components/molecules/SegmentedControl';
import { SliderField } from '@/components/molecules/SliderField';
import type { WorkOnLeave } from '@/domain/calculator/BenefitSimulation';

import type { CalculatorForm } from '../CalculatorForm';

import { styles } from './calculator.styles';

type Props = {
  form: CalculatorForm;
  parentalWeeks: number;
  onZaZyciem: (value: boolean) => void;
  onPreterm: (patch: Partial<CalculatorForm['preterm']>) => void;
  onAdoption: (patch: Partial<CalculatorForm['adoption']>) => void;
  onWork: (patch: Partial<WorkOnLeave>) => void;
};

const WHO_OPTIONS: { value: WorkOnLeave['who']; label: string }[] = [
  { value: 'none', label: 'Nikt' },
  { value: 'mother', label: 'Mama' },
  { value: 'father', label: 'Tata' },
];
const FRACTION_OPTIONS = [
  { value: 0.25, label: '¼ etatu' },
  { value: 0.5, label: '½ etatu' },
];

/** „Więcej opcji”: „Za życiem”, wcześniak, odroczona szkoła (rodzina zastępcza), praca na urlopie. */
export function MoreOptionsFields({ form, parentalWeeks, onZaZyciem, onPreterm, onAdoption, onWork }: Props) {
  const { preterm, work } = form;

  return (
    <>
      <CheckboxRow label="Zaświadczenie „Za życiem”" checked={form.zaZyciem} onToggle={() => onZaZyciem(!form.zaZyciem)} />

      {form.situation === 'birth' ? (
        <CheckboxRow
          label="Wcześniak / dziecko w szpitalu"
          checked={preterm.on}
          onToggle={() => onPreterm({ on: !preterm.on })}
        />
      ) : null}
      {form.situation === 'birth' && preterm.on ? (
        <View style={styles.row}>
          <View style={styles.rowItem}>
            <NumberField
              compact
              integer
              label="Tydz. ciąży"
              value={preterm.gestationWeek}
              onChange={(gestationWeek) => onPreterm({ gestationWeek })}
            />
          </View>
          <View style={styles.rowItem}>
            <NumberField
              compact
              integer
              label="Masa (g)"
              value={preterm.birthWeightGrams}
              onChange={(birthWeightGrams) => onPreterm({ birthWeightGrams })}
            />
          </View>
          <View style={styles.rowItem}>
            <NumberField
              compact
              integer
              label="Dni w szpitalu"
              value={preterm.hospitalDays}
              onChange={(hospitalDays) => onPreterm({ hospitalDays })}
            />
          </View>
        </View>
      ) : null}

      {form.situation === 'adoption' && form.adoption.kind === 'foster' ? (
        <CheckboxRow
          label="Odroczony obowiązek szkolny"
          checked={form.adoption.deferredSchool}
          onToggle={() => onAdoption({ deferredSchool: !form.adoption.deferredSchool })}
        />
      ) : null}

      <SegmentedControl
        label="Praca na urlopie rodzicielskim"
        options={WHO_OPTIONS}
        value={work.who}
        onChange={(who) => onWork({ who })}
      />
      {work.who !== 'none' ? (
        <>
          <SegmentedControl options={FRACTION_OPTIONS} value={work.fraction} onChange={(fraction) => onWork({ fraction })} />
          <SliderField
            label="Tygodnie pracy"
            unit="tyg."
            value={Math.min(work.weeks, parentalWeeks)}
            min={1}
            max={parentalWeeks}
            onChange={(weeks) => onWork({ weeks })}
          />
        </>
      ) : null}
    </>
  );
}
