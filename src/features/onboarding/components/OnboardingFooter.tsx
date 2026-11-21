import { Button } from '@/components/atoms/Button';

import type { OnboardingForm } from '../useOnboardingForm';

type Props = { form: OnboardingForm };

/** Przycisk na dole ankiety. W krokach jednokrotnego wyboru go nie ma — wybór karty sam przechodzi dalej. */
export function OnboardingFooter({ form }: Props) {
  if (form.autoAdvances) return null;

  if (form.isLastStep) {
    return <Button title="Zakończ i uruchom asystenta" onPress={form.finish} />;
  }

  return <Button title="Dalej" onPress={form.goNext} disabled={!form.canContinue} />;
}
