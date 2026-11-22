import { View } from 'react-native';

import { ChoiceCard } from '@/components/molecules/ChoiceCard';
import { ScreenHeader } from '@/components/molecules/ScreenHeader';
import { CHILDREN_COUNT_OPTIONS } from '@/data/onboarding/childrenCountOptions';
import type { ChildrenCount } from '@/domain/profile/ParentProfile';

import { stepStyles } from './onboardingStep.styles';

type Props = {
  selected: ChildrenCount | null;
  onSelect: (count: ChildrenCount) => void;
};

/** Krok „Ile dzieci”: jedno, bliźnięta, trojaczki+. Wybór od razu przechodzi dalej. */
export function ChildrenCountStep({ selected, onSelect }: Props) {
  return (
    <View>
      <ScreenHeader title="Ile dzieci?" subtitle="Przy porodzie mnogim urlopy są dłuższe." />
      <View style={stepStyles.options} accessibilityRole="radiogroup">
        {CHILDREN_COUNT_OPTIONS.map((option) => (
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
