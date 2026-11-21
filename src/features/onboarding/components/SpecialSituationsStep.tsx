import { View } from 'react-native';

import { CheckboxRow } from '@/components/molecules/CheckboxRow';
import { ScreenHeader } from '@/components/molecules/ScreenHeader';
import { SPECIAL_SITUATION_OPTIONS } from '@/data/onboarding/specialSituationOptions';
import type { SpecialSituationId } from '@/domain/profile/ParentProfile';

import { stepStyles } from './onboardingStep.styles';

type Props = {
  selected: readonly SpecialSituationId[];
  onToggle: (id: SpecialSituationId) => void;
};

/** Krok 3: sytuacje szczególne (opcjonalne — można niczego nie zaznaczać). */
export function SpecialSituationsStep({ selected, onToggle }: Props) {
  return (
    <View>
      <ScreenHeader
        title="Sytuacje szczególne"
        subtitle="Pomóż nam dostosować progi i stawki do wyjątkowych sytuacji. Możesz pominąć."
      />
      <View style={stepStyles.options}>
        {SPECIAL_SITUATION_OPTIONS.map((option) => (
          <CheckboxRow
            key={option.id}
            label={option.label}
            checked={selected.includes(option.id)}
            onToggle={() => onToggle(option.id)}
          />
        ))}
      </View>
    </View>
  );
}
