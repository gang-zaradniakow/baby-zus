import { StepLayout } from '@/components/templates/StepLayout';
import { OnboardingFooter } from '@/features/onboarding/components/OnboardingFooter';
import { OnboardingStepContent } from '@/features/onboarding/components/OnboardingStepContent';
import { OnboardingTopBar } from '@/features/onboarding/components/OnboardingTopBar';
import { ONBOARDING_STEPS, useOnboardingForm } from '@/features/onboarding/useOnboardingForm';
import { useSession } from '@/session';

export function OnboardingScreen() {
  const { completeOnboarding } = useSession();
  const form = useOnboardingForm(completeOnboarding);

  return (
    <StepLayout
      header={
        <OnboardingTopBar
          step={form.step}
          total={ONBOARDING_STEPS}
          onBack={form.step > 1 ? form.goBack : undefined}
        />
      }
      footer={<OnboardingFooter form={form} />}
    >
      <OnboardingStepContent form={form} />
    </StepLayout>
  );
}
