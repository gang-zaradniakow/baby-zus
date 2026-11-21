import { View } from 'react-native';

import { ChoiceCard } from '@/components/molecules/ChoiceCard';
import { ScreenHeader } from '@/components/molecules/ScreenHeader';
import { ROLE_OPTIONS } from '@/data/onboarding/roleOptions';
import type { ParentRole } from '@/domain/profile/ParentProfile';

import { stepStyles } from './onboardingStep.styles';

type Props = {
  selected: ParentRole | null;
  onSelect: (role: ParentRole) => void;
};

/** Krok „Rola”: kim rodzic jest dla dziecka. Wybór od razu przechodzi dalej. */
export function RoleStep({ selected, onSelect }: Props) {
  return (
    <View>
      <ScreenHeader
        title="Kim jesteś dla dziecka?"
        subtitle="Od tego zależy, które świadczenia Ci przysługują."
      />
      <View style={stepStyles.options} accessibilityRole="radiogroup">
        {ROLE_OPTIONS.map((option) => (
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
