import { Button } from '@/components/atoms/Button';

import type { OnboardingForm } from '../useOnboardingForm';

type Props = { form: OnboardingForm };

/**
 * Przycisk na dole ankiety. W krokach jednokrotnego wyboru „Dalej” nie ma — wybór karty sam
 * przechodzi dalej; ostatni krok zawsze ma „Zakończ”, aktywne dopiero po odpowiedzi.
 */
export function OnboardingFooter({ form }: Props) {
  if (form.isLastStep) {
    return <Button title="Zakończ i uruchom asystenta" onPress={form.finish} disabled={!form.canContinue} />;
  }

  if (form.autoAdvances) return null;

  return <Button title="Dalej" onPress={form.goNext} disabled={!form.canContinue} />;
}
