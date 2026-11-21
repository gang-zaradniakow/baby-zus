import type { OnboardingForm } from '../useOnboardingForm';

import { EmploymentStep } from './EmploymentStep';
import { EventDateStep } from './EventDateStep';
import { SpecialSituationsStep } from './SpecialSituationsStep';
import { StageStep } from './StageStep';

type Props = { form: OnboardingForm };

/** Wybiera komponent bieżącego kroku i podaje mu tylko potrzebne dane. */
export function OnboardingStepContent({ form }: Props) {
  switch (form.step) {
    case 1:
      return <StageStep selected={form.draft.stage} onSelect={form.selectStage} />;
    case 2:
      return form.draft.stage ? (
        <EventDateStep
          stage={form.draft.stage}
          value={form.draft.eventDateText}
          error={form.eventDateError}
          onChange={form.setEventDateText}
        />
      ) : null;
    case 3:
      return <EmploymentStep selected={form.draft.employment} onToggle={form.toggleEmploymentOption} />;
    case 4:
      return <SpecialSituationsStep selected={form.draft.special} onToggle={form.toggleSpecialSituation} />;
  }
}
