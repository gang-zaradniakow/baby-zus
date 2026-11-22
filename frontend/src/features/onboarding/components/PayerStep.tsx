import { View } from 'react-native';

import { ChoiceCard } from '@/components/molecules/ChoiceCard';
import { ScreenHeader } from '@/components/molecules/ScreenHeader';
import { PAYER_SIZE_OPTIONS } from '@/data/onboarding/payerSizeOptions';
import type { PayerSize } from '@/domain/profile/ParentProfile';

import { stepStyles } from './onboardingStep.styles';

type Props = {
  selected: PayerSize | null;
  onSelect: (size: PayerSize) => void;
};

/** Krok „Płatnik”: ile osób zatrudnia pracodawca. Tylko przy umowie o pracę lub zleceniu. */
export function PayerStep({ selected, onSelect }: Props) {
  return (
    <View>
      <ScreenHeader
        title="Ile osób zatrudnia Twój pracodawca (płatnik)?"
        subtitle="Od tego zależy, kto wypłaci zasiłek."
      />
      <View style={stepStyles.options} accessibilityRole="radiogroup">
        {PAYER_SIZE_OPTIONS.map((option) => (
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
