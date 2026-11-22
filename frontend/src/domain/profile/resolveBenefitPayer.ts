import { hasExternalPayer } from './hasExternalPayer';
import type { ParentProfile } from './ParentProfile';

/**
 * Kto wypłaca zasiłek (macierzyński, chorobowy w ciąży).
 * Płatnik zatrudniający 21+ osób wypłaca sam; do 20 osób albo przy samej firmie — ZUS.
 * Przy „nie wiem” zakładamy pracodawcę (częstszy przypadek), jak w prototypie.
 */
export function resolveBenefitPayer(profile: Pick<ParentProfile, 'employment' | 'payerSize'>): 'ZUS' | 'PRAC' {
  return hasExternalPayer(profile.employment) && profile.payerSize !== 'maly' ? 'PRAC' : 'ZUS';
}
