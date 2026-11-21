import { View } from 'react-native';

import { ChoiceCard } from '@/components/molecules/ChoiceCard';
import { ScreenHeader } from '@/components/molecules/ScreenHeader';
import { STAGE_OPTIONS } from '@/data/onboarding/stageOptions';
import type { ParentStage } from '@/domain/profile/ParentProfile';

import { stepStyles } from './onboardingStep.styles';

type Props = {
  selected: ParentStage | null;
  onSelect: (stage: ParentStage) => void;
};

/** Krok 1: etap rodzicielstwa. Wybór od razu przechodzi dalej. */
export function StageStep({ selected, onSelect }: Props) {
  return (
    <View>
      <ScreenHeader
        title="Na jakim etapie teraz jesteś?"
        subtitle="Wybierz, abyśmy dopasowali harmonogram do Twojej sytuacji."
      />
      <View style={stepStyles.options} accessibilityRole="radiogroup">
        {STAGE_OPTIONS.map((option) => (
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
