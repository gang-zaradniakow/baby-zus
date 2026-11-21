import { fromISODate } from '@/domain/dates/calendarDate';
import { getInsuranceFlags, type InsuranceFlags } from '@/domain/profile/insuranceFlags';
import type { ParentProfile } from '@/domain/profile/ParentProfile';
import { resolveBenefitPayer } from '@/domain/profile/resolveBenefitPayer';

import type { Institution } from './TimelineItem';

/** Dane z profilu potrzebne regułom osi czasu, już przeliczone. */
export type TimelineContext = {
  /** Termin porodu / data urodzenia / data przyjęcia. */
  eventDate: Date;
  insurance: InsuranceFlags;
  /** Czy pokazujemy uprawnienia drugiego rodzica (tylko gdy rodzic tego chce). */
  tracksPartner: boolean;
  /** Kto wypłaca zasiłek macierzyński: ZUS (sama firma, mały płatnik) albo pracodawca. */
  benefitPayer: Institution;
};

export function createTimelineContext(profile: ParentProfile): TimelineContext {
  return {
    eventDate: fromISODate(profile.eventDate),
    insurance: getInsuranceFlags(profile.employment),
    tracksPartner: profile.partner === 'track',
    benefitPayer: resolveBenefitPayer(profile),
  };
}
