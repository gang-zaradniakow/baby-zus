import { LEGAL_PARAMS, type LegalParams } from '@/data/legalParams';
import { addDays, diffDays, fromISODate, toISODate } from '@/domain/dates/calendarDate';
import { formatDate } from '@/domain/dates/formatDate';
import type { ParentProfile } from '@/domain/profile/ParentProfile';
import { formatMoney } from '@/utils/formatMoney';

import type { ZusAccount } from './ZusAccount';
import type { ZusDocument } from './ZusDocument';

/**
 * Ogólne pisma z ZUS wynikające z profilu i konta (port `makeDocs` bez pism konkretnych osób):
 * informacja o tytułach ubezpieczenia; po porodzie (20+ dni) — informacja o wysokości zasiłku
 * macierzyńskiego dla ubezpieczonej mamy. Pisma przykładowych osób dokłada `data/demo`.
 * Najnowsze pierwsze.
 */
export function buildZusDocuments(
  profile: ParentProfile,
  account: ZusAccount,
  today: Date,
  extra: readonly ZusDocument[] = [],
  params: LegalParams = LEGAL_PARAMS,
): ZusDocument[] {
  const insured = account.hasSicknessInsurance;
  const docs: ZusDocument[] = [
    {
      id: 'tytuly',
      title: 'Informacja o tytułach ubezpieczenia (eZUS)',
      date: toISODate(today),
      from: 'ZUS',
      read: true,
      summary: insured
        ? 'Według danych w eZUS podlegasz ubezpieczeniu chorobowemu. To warunek zasiłku chorobowego i macierzyńskiego — liczy się stan w dniu porodu lub przyjęcia dziecka.'
        : 'Według danych w eZUS nie podlegasz ubezpieczeniu chorobowemu. Bez niego zasiłki z ZUS nie przysługują.',
      todo: insured
        ? 'Nic nie musisz robić — dokument działa też bez internetu.'
        : 'Sprawdź w zakładce Wiedza, jak zgłosić się do dobrowolnego ubezpieczenia chorobowego (ZUS ZUA).',
      body: `Zakład Ubezpieczeń Społecznych\n\nInformacja o tytułach do ubezpieczeń społecznych na dzień ${formatDate(today)}.\nUbezpieczenie chorobowe: ${insured ? 'TAK' : 'NIE'}\n\n(dokument demonstracyjny — dane fikcyjne)`,
    },
  ];

  const birth = profile.stage === 'dziecko' ? fromISODate(profile.eventDate) : null;
  const isMother = profile.role === 'mama';
  const blockedByDebt = account.debt > params.debtLimit;
  if (birth && isMother && insured && !blockedByDebt && diffDays(birth, today) > 20) {
    const base = Math.max(6500 * (1 - params.socialContributionRate), params.minBenefitBase);
    docs.push({
      id: 'wysokosc-mac',
      title: 'Informacja o wysokości zasiłku macierzyńskiego',
      date: toISODate(addDays(birth, 18)),
      from: 'ZUS',
      read: true,
      summary: `Twój zasiłek macierzyński za urlop macierzyński to ${formatMoney(base)} brutto miesięcznie (100% podstawy). Od kwoty potrącamy tylko zaliczkę na podatek. Wypłata do 15. dnia każdego miesiąca.`,
      todo: 'Brak działań.',
      body: `Zakład Ubezpieczeń Społecznych\n\nPodstawa wymiaru zasiłku: ${formatMoney(base)}\nWysokość zasiłku: 100% podstawy wymiaru\nOkres: od ${formatDate(birth)}\nZaliczka na podatek dochodowy pobierana zgodnie z przepisami.`,
    });
  }

  return [...docs, ...extra].sort((a, b) => b.date.localeCompare(a.date));
}
