import type { WizardDefinition } from '@/domain/wizards/Wizard';

import { adoptionLeaveWizard } from './adoptionLeaveWizard';
import { averagedBenefitWizard } from './averagedBenefitWizard';
import { birthCertificateWizard } from './birthCertificateWizard';
import { careAllowanceWizard } from './careAllowanceWizard';
import { funeralAllowanceWizard } from './funeralAllowanceWizard';
import { maternityTakeoverWizard } from './maternityTakeoverWizard';
import { parentalLeaveWizard } from './parentalLeaveWizard';
import { paternityLeaveWizard } from './paternityLeaveWizard';
import { supplementaryLeaveWizard } from './supplementaryLeaveWizard';

/** Kreatory w kolejności listy „Wnioski i pisma” (jak WIZARD_ORDER w prototypie). */
export const WIZARDS: readonly WizardDefinition[] = [
  averagedBenefitWizard,
  parentalLeaveWizard,
  paternityLeaveWizard,
  supplementaryLeaveWizard,
  careAllowanceWizard,
  adoptionLeaveWizard,
  maternityTakeoverWizard,
  birthCertificateWizard,
  funeralAllowanceWizard,
];

export const findWizard = (id: string | undefined) => WIZARDS.find((w) => w.id === id) ?? null;
