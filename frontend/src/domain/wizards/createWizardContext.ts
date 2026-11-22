import { LEGAL_PARAMS, type LegalParams } from '@/data/legalParams';
import { fromISODate } from '@/domain/dates/calendarDate';
import { isBeforeBirth } from '@/domain/profile/isBeforeBirth';
import type { ParentProfile } from '@/domain/profile/ParentProfile';

import type { WizardContext } from './Wizard';

/** Dane do kreatorów z profilu (jak `ctx()` + `fullName`/`childName`/`childBirth` w prototypie). */
export function createWizardContext(
  profile: ParentProfile | null,
  today: Date,
  params: LegalParams = LEGAL_PARAMS,
): WizardContext {
  const surname = profile?.role === 'tata' ? 'Przykładowy' : 'Przykładowa';
  const stage = profile?.stage;
  const event = profile ? fromISODate(profile.eventDate) : null;
  const childBirth =
    stage === 'dziecko' ? event : stage === 'adopcja' && profile?.childBirthDate ? fromISODate(profile.childBirthDate) : null;
  const employment = profile?.employment ?? [];

  return {
    today,
    applicantName: `${profile?.name ?? 'Jan'} ${surname}`,
    childName: profile?.childName ?? 'dziecko',
    childBirth,
    adoptionDate: stage === 'adopcja' ? event : null,
    dueDate: stage && isBeforeBirth(stage) ? event : null,
    childrenCount: profile?.childrenCount ?? 1,
    businessOnly: employment.includes('jdg') && !employment.includes('uop'),
    params,
  };
}
