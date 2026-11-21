import { Accordion } from '@/components/molecules/Accordion';
import { CheckboxRow } from '@/components/molecules/CheckboxRow';
import { NumberField } from '@/components/molecules/NumberField';
import { Card } from '@/components/atoms/Card';

import type { CalculatorForm } from '../CalculatorForm';

type Props = {
  pregnancy: CalculatorForm['pregnancy'];
  /** Dni wykorzystane i 50+ lat mają znaczenie tylko na etacie. */
  employee: boolean;
  onChange: (patch: Partial<CalculatorForm['pregnancy']>) => void;
};

/** Dane L4 w ciąży: liczba dni, a w „Więcej opcji” dni wykorzystane, wiek 50+ i staż ubezpieczenia. */
export function PregnancyFields({ pregnancy, employee, onChange }: Props) {
  return (
    <>
      <Card>
        <NumberField label="Ile dni L4 w ciąży?" unit="dni" integer value={pregnancy.days} onChange={(days) => onChange({ days })} />
      </Card>
      <Accordion title="Więcej opcji">
        {employee ? (
          <>
            <NumberField
              label="Dni L4 już wykorzystane w tym roku"
              unit="dni"
              integer
              value={pregnancy.usedDays}
              onChange={(usedDays) => onChange({ usedDays })}
            />
            <CheckboxRow
              label="Mam 50 lat lub więcej"
              checked={pregnancy.age50}
              onToggle={() => onChange({ age50: !pregnancy.age50 })}
            />
          </>
        ) : null}
        <NumberField
          label="Od ilu dni masz ubezpieczenie chorobowe?"
          unit="dni"
          integer
          value={pregnancy.insuredDays}
          onChange={(insuredDays) => onChange({ insuredDays })}
        />
      </Accordion>
    </>
  );
}
