import { View } from 'react-native';

import { CheckboxRow } from '@/components/molecules/CheckboxRow';
import { ScreenHeader } from '@/components/molecules/ScreenHeader';
import { EMPLOYMENT_OPTIONS } from '@/data/onboarding/employmentOptions';
import type { EmploymentId } from '@/domain/profile/ParentProfile';

import { stepStyles } from './onboardingStep.styles';

type Props = {
  selected: readonly EmploymentId[];
  onToggle: (id: EmploymentId) => void;
};

/** Krok 2: formy zatrudnienia (można łączyć — zbieg tytułów ubezpieczenia). */
export function EmploymentStep({ selected, onToggle }: Props) {
  return (
    <View>
      <ScreenHeader
        title="Forma zatrudnienia"
        subtitle="Zaznacz wszystkie opcje, które Cię dotyczą (zbieg tytułów ubezpieczenia)."
      />
      <View style={stepStyles.options}>
        {EMPLOYMENT_OPTIONS.map((option) => (
          <CheckboxRow
            key={option.id}
            label={option.label}
            hint={option.hint}
            checked={selected.includes(option.id)}
            onToggle={() => onToggle(option.id)}
          />
        ))}
      </View>
    </View>
  );
}
