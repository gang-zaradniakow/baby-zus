import { Card } from '@/components/atoms/Card';
import { DateField } from '@/components/molecules/DateField';
import { NumberField } from '@/components/molecules/NumberField';
import { SegmentedControl } from '@/components/molecules/SegmentedControl';
import type { AdoptionKind } from '@/domain/calculator/adoptionLeaveWeeks';
import { parsePolishDate } from '@/domain/dates/parsePolishDate';

import type { CalculatorForm } from '../CalculatorForm';

type Props = {
  form: CalculatorForm;
  onDateText: (text: string) => void;
  onChildrenCount: (count: number) => void;
  onAdoption: (patch: Partial<CalculatorForm['adoption']>) => void;
};

const COUNT_OPTIONS = [1, 2, 3, 4, 5].map((n) => ({ value: n, label: n === 5 ? '5+' : String(n) }));
const ADOPTION_OPTIONS: { value: AdoptionKind; label: string }[] = [
  { value: 'adoption', label: 'Adopcja' },
  { value: 'foster', label: 'Rodzina zastępcza' },
];

/** Karta dziecka: data porodu albo przyjęcia, liczba dzieci; przy adopcji rodzaj i wiek dziecka. */
export function ChildFields({ form, onDateText, onChildrenCount, onAdoption }: Props) {
  const isAdoption = form.situation === 'adoption';
  const dateError =
    form.dateText.length === 10 && !parsePolishDate(form.dateText) ? 'Taka data nie istnieje. Sprawdź dzień i miesiąc.' : null;

  return (
    <Card>
      {isAdoption ? (
        <SegmentedControl
          label="Rodzaj"
          options={ADOPTION_OPTIONS}
          value={form.adoption.kind}
          onChange={(kind) => onAdoption({ kind })}
        />
      ) : null}
      <DateField
        label={isAdoption ? 'Data przyjęcia' : 'Data porodu (lub planowana)'}
        value={form.dateText}
        error={dateError}
        onChangeText={onDateText}
      />
      {isAdoption ? (
        <NumberField
          label="Wiek dziecka (lata)"
          unit="lat"
          value={form.adoption.childAgeYears}
          onChange={(childAgeYears) => onAdoption({ childAgeYears })}
        />
      ) : null}
      <SegmentedControl label="Liczba dzieci" options={COUNT_OPTIONS} value={form.childrenCount} onChange={onChildrenCount} />
    </Card>
  );
}
