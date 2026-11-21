import { View } from 'react-native';

import { AppText } from '@/components/atoms/AppText';
import { Card } from '@/components/atoms/Card';
import { CheckboxRow } from '@/components/molecules/CheckboxRow';
import { DateField } from '@/components/molecules/DateField';
import { NumberField } from '@/components/molecules/NumberField';
import { RadioRow } from '@/components/molecules/RadioRow';
import type { WizardAnswers, WizardContext, WizardStep } from '@/domain/wizards/Wizard';

import { styles } from './wizard.styles';

type Props = {
  step: WizardStep;
  answers: WizardAnswers;
  ctx: WizardContext;
  onChange: (id: string, value: string) => void;
};

/** Pole odpowiedzi dla jednego kroku kreatora — zależnie od rodzaju kroku. */
export function WizardStepInput({ step, answers, ctx, onChange }: Props) {
  const value = answers[step.id] ?? '';

  switch (step.kind) {
    case 'date':
      return <DateField label={step.question} value={value} onChangeText={(text) => onChange(step.id, text)} />;
    case 'number':
      return (
        <NumberField
          integer
          label={step.question}
          unit={step.unit}
          value={value ? Number(value) : 0}
          onChange={(n) => onChange(step.id, n ? String(n) : '')}
        />
      );
    case 'choice':
      return (
        <View style={styles.options} accessibilityRole="radiogroup">
          {step.options.map((option) => (
            <RadioRow
              key={option.value}
              label={option.label}
              hint={option.hint}
              selected={value === option.value}
              onPress={() => onChange(step.id, option.value)}
            />
          ))}
        </View>
      );
    case 'info':
      return (
        <Card tone="info">
          <AppText>{step.text(ctx)}</AppText>
        </Card>
      );
    case 'document':
      return (
        <CheckboxRow
          label="Mam ten dokument — dołączę go przy składaniu"
          hint="W prototypie nie wysyłamy plików. Możesz to zrobić później."
          checked={value === 'yes'}
          onToggle={() => onChange(step.id, value === 'yes' ? '' : 'yes')}
        />
      );
  }
}
