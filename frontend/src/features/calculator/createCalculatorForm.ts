import { LEGAL_PARAMS, type LegalParams } from '@/data/legalParams';
import { diffDays, fromISODate } from '@/domain/dates/calendarDate';
import { formatDate } from '@/domain/dates/formatDate';
import type { ParentProfile } from '@/domain/profile/ParentProfile';

import type { CalculatorForm, CalculatorSituation } from './CalculatorForm';
import { createPersonForm } from './personForm';

/**
 * Formularz kalkulatora wypełniony z ankiety (jak `simDefaults` w prototypie): moja praca trafia do
 * mamy albo taty zależnie od roli, drugi rodzic domyślnie na etacie (albo bez — przy samodzielnym
 * wychowywaniu), data, liczba dzieci, „Za życiem”, wcześniak i wiek dziecka przy adopcji.
 */
export function createCalculatorForm(
  profile: ParentProfile | null,
  today: Date,
  situation?: CalculatorSituation,
  params: LegalParams = LEGAL_PARAMS,
): CalculatorForm {
  const employment = profile?.employment.filter((id) => id !== 'brak') ?? ['uop'];
  const me = createPersonForm(employment, params);
  const single = profile?.partner === 'single';
  const other = createPersonForm(single ? [] : ['uop'], params);
  const isFather = profile?.role === 'tata';
  const eventDate = profile ? fromISODate(profile.eventDate) : today;

  const childAgeYears =
    profile?.stage === 'adopcja' && profile.childBirthDate
      ? Math.round((diffDays(fromISODate(profile.childBirthDate), eventDate) / 365.25) * 10) / 10
      : 1;
  const fatherTakesLeave = isFather || !single;

  return {
    situation: situation ?? (profile?.stage === 'adopcja' ? 'adoption' : 'birth'),
    dateText: formatDate(eventDate),
    childrenCount: profile?.childrenCount ?? 1,
    zaZyciem: profile?.special.includes('zazyciem') ?? false,
    preterm: { on: profile?.special.includes('preterm') ?? false, gestationWeek: 32, birthWeightGrams: 1800, hospitalDays: 21 },
    adoption: { kind: 'adoption', childAgeYears, deferredSchool: false },
    variant: 'standard',
    mother: isFather ? other : me,
    father: isFather ? me : other,
    fatherPlan: {
      paternity: fatherTakesLeave,
      parentalWeeks: fatherTakesLeave ? params.nonTransferableWeeks : 0,
      maternityTakeover: 0,
    },
    work: { who: 'none', fraction: 0.5, weeks: 8 },
    pregnancy: { days: 60, usedDays: 0, age50: false, insuredDays: 365 },
  };
}
