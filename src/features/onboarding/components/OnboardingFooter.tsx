import { Button } from '@/components/atoms/Button';

import { ONBOARDING_STEPS, type OnboardingForm } from '../useOnboardingForm';

type Props = { form: OnboardingForm };

/** Przycisk na dole kreatora. W kroku 1 go nie ma — wybór karty sam przechodzi dalej. */
export function OnboardingFooter({ form }: Props) {
  if (form.step === 1) return null;

  if (form.step === ONBOARDING_STEPS) {
    return <Button title="Zakończ i uruchom asystenta" onPress={form.finish} />;
  }

  return <Button title="Dalej" onPress={form.goNext} disabled={!form.canContinue} />;
}
