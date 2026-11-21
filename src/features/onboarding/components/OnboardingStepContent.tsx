import type { OnboardingForm } from '../useOnboardingForm';

import { ChildBirthDateStep } from './ChildBirthDateStep';
import { ChildrenCountStep } from './ChildrenCountStep';
import { EmploymentStep } from './EmploymentStep';
import { EventDateStep } from './EventDateStep';
import { NamesStep } from './NamesStep';
import { PartnerStep } from './PartnerStep';
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
    case 'childBirthDate':
      return (
        <ChildBirthDateStep
          value={form.draft.childBirthDateText}
          error={form.childBirthDateError}
          onChange={form.setChildBirthDateText}
        />
      );
    case 'count':
      return <ChildrenCountStep selected={form.draft.childrenCount} onSelect={form.selectChildrenCount} />;
    case 'special':
      return <SpecialSituationsStep selected={form.draft.special} onToggle={form.toggleSpecialSituation} />;
    case 'employment':
      return <EmploymentStep selected={form.draft.employment} onToggle={form.toggleEmploymentOption} />;
    case 'payer':
      return <PayerStep selected={form.draft.payerSize} onSelect={form.selectPayerSize} />;
    case 'partner':
      return <PartnerStep selected={form.draft.partner} onSelect={form.selectPartner} />;
    case 'names':
      return (
        <NamesStep
          name={form.draft.name}
          childName={form.draft.childName}
          asksChildName={form.draft.stage !== 'ciaza'}
          onChangeName={form.setName}
          onChangeChildName={form.setChildName}
        />
      );
  }
}
