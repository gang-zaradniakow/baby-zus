import { View } from 'react-native';

import { AppText } from '@/components/atoms/AppText';
import { ChoiceCard } from '@/components/molecules/ChoiceCard';
import { SITUATION_OPTIONS } from '@/data/calculator/situationOptions';
import type { CalculatorSituation } from '@/domain/calculator/CalculatorSituation';

import { styles } from './calculator.styles';

type Props = {
  selected: CalculatorSituation;
  onSelect: (situation: CalculatorSituation) => void;
};

/** „Co chcesz policzyć?” — L4 w ciąży, poród albo przyjęcie dziecka. */
export function SituationPicker({ selected, onSelect }: Props) {
  return (
    <View style={styles.section}>
      <AppText variant="cardTitle">Co chcesz policzyć?</AppText>
      <View style={styles.stack} accessibilityRole="radiogroup">
        {SITUATION_OPTIONS.map((option) => (
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
