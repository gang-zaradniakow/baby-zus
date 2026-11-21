import { fromISODate } from '@/domain/dates/calendarDate';
import { getInsuranceFlags, type InsuranceFlags } from '@/domain/profile/insuranceFlags';
import type { ParentProfile } from '@/domain/profile/ParentProfile';

import type { Institution } from './TimelineItem';

/** Dane z profilu potrzebne regułom osi czasu, już przeliczone. */
export type TimelineContext = {
  /** Termin porodu / data urodzenia / data przyjęcia. */
  eventDate: Date;
  insurance: InsuranceFlags;
  /** Czy pokazujemy uprawnienia drugiego rodzica (nie — przy samodzielnym wychowywaniu). */
  tracksPartner: boolean;
  /** Kto wypłaca zasiłek macierzyński: ZUS (sama firma) albo pracodawca. */
  benefitPayer: Institution;
};

export function createTimelineContext(profile: ParentProfile): TimelineContext {
  const insurance = getInsuranceFlags(profile.employment);
  const onlyBusiness = insurance.hasBusiness && !insurance.hasEmploymentContract;

  return {
    eventDate: fromISODate(profile.eventDate),
    insurance,
    tracksPartner: !profile.special.includes('single'),
    benefitPayer: onlyBusiness ? 'ZUS' : 'PRAC',
  };
}
