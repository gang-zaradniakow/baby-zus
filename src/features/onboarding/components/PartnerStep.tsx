import { View } from 'react-native';

import { ChoiceCard } from '@/components/molecules/ChoiceCard';
import { ScreenHeader } from '@/components/molecules/ScreenHeader';
import { PARTNER_OPTIONS } from '@/data/onboarding/partnerOptions';
import type { PartnerMode } from '@/domain/profile/ParentProfile';

import { stepStyles } from './onboardingStep.styles';

type Props = {
  selected: PartnerMode | null;
  onSelect: (mode: PartnerMode) => void;
};

/** Krok „Drugi rodzic”: czy pokazywać jego uprawnienia, czy rodzic wychowuje sam. */
export function PartnerStep({ selected, onSelect }: Props) {
  return (
    <View>
      <ScreenHeader title="Drugi rodzic" subtitle="Część urlopów przysługuje obojgu rodzicom." />
      <View style={stepStyles.options} accessibilityRole="radiogroup">
        {PARTNER_OPTIONS.map((option) => (
          <ChoiceCard
            key={option.id}
            icon={option.icon}
            title={option.title}
            subtitle={option.subtitle}
            tone={option.tone}
            selected={selected === option.id}
            onPress={() => onSelect(option.id)}
          />
        ))}
      </View>
    </View>
  );
}
