import type { OnboardingForm } from '../useOnboardingForm';

import { ChildrenCountStep } from './ChildrenCountStep';
import { EmploymentStep } from './EmploymentStep';
import { EventDateStep } from './EventDateStep';
import { PayerStep } from './PayerStep';
import { RoleStep } from './RoleStep';
import { SpecialSituationsStep } from './SpecialSituationsStep';
import { StageStep } from './StageStep';

type Props = { form: OnboardingForm };

/** Wybiera komponent bieżącego kroku i podaje mu tylko potrzebne dane. */
export function OnboardingStepContent({ form }: Props) {
  switch (form.step) {
    case 'role':
      return <RoleStep selected={form.draft.role} onSelect={form.selectRole} />;
    case 'stage':
      return <StageStep selected={form.draft.stage} onSelect={form.selectStage} />;
    case 'date':
      return form.draft.stage ? (
        <EventDateStep
          stage={form.draft.stage}
          value={form.draft.eventDateText}
          error={form.eventDateError}
          onChange={form.setEventDateText}
        />
      ) : null;
    case 'count':
      return <ChildrenCountStep selected={form.draft.childrenCount} onSelect={form.selectChildrenCount} />;
    case 'special':
      return <SpecialSituationsStep selected={form.draft.special} onToggle={form.toggleSpecialSituation} />;
    case 'employment':
      return <EmploymentStep selected={form.draft.employment} onToggle={form.toggleEmploymentOption} />;
    case 'payer':
      return <PayerStep selected={form.draft.payerSize} onSelect={form.selectPayerSize} />;
  }
}
