import { LEGAL_PARAMS, type LegalParams } from '@/data/legalParams';
import { addMonths, fromISODate } from '@/domain/dates/calendarDate';
import { formatDate } from '@/domain/dates/formatDate';
import { deadlineAfterDays } from '@/domain/deadlines/deadlines';
import type { ParentProfile } from '@/domain/profile/ParentProfile';
import { resolveBenefitPayer } from '@/domain/profile/resolveBenefitPayer';
import { formatMoney } from '@/utils/formatMoney';

/**
 * „Dla Ciebie:” — dopowiedzenie do odpowiedzi z bazy wiedzy na podstawie profilu (port `personalize`
 * z prototypu). `null` — nic do dodania. `debt` — zaległość z eZUS (po zalogowaniu).
 */
export function personalizeAnswer(
  entryId: string,
  profile: ParentProfile | null,
  debt = 0,
  params: LegalParams = LEGAL_PARAMS,
): string | null {
  if (!profile) return null;
  const { employment } = profile;
  const employee = employment.includes('uop');
  const businessOnly = employment.includes('jdg') && !employee;
  const birth = profile.stage === 'dziecko' ? fromISODate(profile.eventDate) : null;

  if ((entryId === 'mac-gdzie' || entryId === 'mac-21') && businessOnly) {
    return 'prowadzisz firmę — wniosek ZAM składasz bezpośrednio do ZUS przez eZUS.';
  }
  if ((entryId === 'mac-gdzie' || entryId === 'l4-kto') && employee) {
    return resolveBenefitPayer(profile) === 'ZUS'
      ? 'Twój pracodawca zgłasza do 20 osób — przekaże wniosek do ZUS, który wypłaci zasiłek.'
      : 'Twój pracodawca zgłasza ponad 20 osób (albo nie wiesz) — zwykle sam wypłaca zasiłek; potwierdź w kadrach.';
  }
  if (entryId === 'jdg-dlug' && debt > params.debtLimit) {
    return `w eZUS widzimy zaległość ${formatMoney(debt)}. Spłać ją, a zasiłek zostanie wypłacony z wyrównaniem.`;
  }
  if (entryId === 'ojcowski' && birth) {
    return `urlop ojcowski musi się skończyć przed ${formatDate(addMonths(birth, 12))}.`;
  }
  if (entryId === 'mac-21' && birth && profile.role === 'mama') {
    return `Twój termin: ${formatDate(deadlineAfterDays(birth, 21).legal, true)}.`;
  }
  return null;
}
