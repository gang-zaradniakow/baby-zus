import { LEGAL_PARAMS, type LegalParams } from '@/data/legalParams';
import type { ZusAccount } from '@/domain/zus/ZusAccount';

import type { PersonForm } from './CalculatorForm';
import { patchTitle } from './personForm';

const round2 = (value: number) => Math.round(value * 100) / 100;

/**
 * Podstawy z konta eZUS (po zalogowaniu) zamiast domyślnych — „Przelicz zasiłek na tych danych”:
 * etat i firma dostają podstawę składek minus 13,71%, firma także zaległość z konta.
 */
export function applyZusAccount(person: PersonForm, account: ZusAccount, params: LegalParams = LEGAL_PARAMS): PersonForm {
  const toBase = (contributionBase: number) => round2(contributionBase * (1 - params.socialContributionRate));
  let result = person;

  const employment = account.titles.find((t) => t.name === 'Umowa o pracę');
  if (employment && result.titles.uop.on) {
    result = patchTitle(result, 'uop', { base: Math.max(toBase(employment.contributionBase), params.minBenefitBase) });
  }
  const business = account.titles.find((t) => t.sickness === 'voluntary' && t.payer.startsWith('Własna firma'));
  if (business && result.titles.jdg.on) {
    result = patchTitle(result, 'jdg', { base: toBase(business.contributionBase), debt: account.debt });
  }
  return result;
}
