import { View } from 'react-native';

import { DateField } from '@/components/molecules/DateField';
import { ScreenHeader } from '@/components/molecules/ScreenHeader';
import { EVENT_DATE_QUESTIONS } from '@/data/onboarding/eventDateQuestions';
import type { ParentStage } from '@/domain/profile/ParentProfile';

type Props = {
  stage: ParentStage;
  value: string;
  error: string | null;
  onChange: (text: string) => void;
};

/** Krok 2: data zdarzenia — pytanie dopasowane do etapu (termin porodu / urodzenie / przyjęcie). */
export function EventDateStep({ stage, value, error, onChange }: Props) {
  const question = EVENT_DATE_QUESTIONS[stage];

  return (
    <View>
      <ScreenHeader title={question.title} subtitle={question.subtitle} />
      <DateField
        label={question.label}
        hint={question.hint}
        value={value}
        error={error}
        onChangeText={onChange}
      />
    </View>
  );
}
