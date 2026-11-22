import { LEGAL_PARAMS, type LegalParams } from '@/data/legalParams';
import type { ParentProfile } from '@/domain/profile/ParentProfile';
import { resolveBenefitPayer } from '@/domain/profile/resolveBenefitPayer';

import type { ZusAccount, ZusAccountExtras, ZusTitle } from './ZusAccount';

/** Domyślna podstawa składek, gdy nie znamy przykładowej osoby (jak w prototypie). */
const DEFAULT_BASE = 6500;

/**
 * Symulowane konto eZUS z profilu (port `zusData` z prototypu): tytuły ubezpieczenia z formą
 * zatrudnienia i statusem chorobowego, e-ZLA i zaległość. Firma obok etatu nie ma chorobowego
 * (zbieg tytułów — tylko składka zdrowotna).
 */
export function buildZusAccount(
  profile: ParentProfile,
  extras?: ZusAccountExtras,
  params: LegalParams = LEGAL_PARAMS,
): ZusAccount {
  const { employment } = profile;
  const base = extras?.contributionBase ?? DEFAULT_BASE;
  const zusPays = resolveBenefitPayer(profile) === 'ZUS';
  const titles: ZusTitle[] = [];

  if (employment.includes('uop')) {
    titles.push({
      name: 'Umowa o pracę',
      payer: zusPays
        ? 'Pracodawca — do 20 ubezpieczonych (zasiłki wypłaca ZUS)'
        : 'Pracodawca — ponad 20 ubezpieczonych (wypłaca zasiłki)',
      since: '2021-03-01',
      sickness: 'mandatory',
      contributionBase: base,
    });
  }
  if (employment.includes('jdg')) {
    const besideEmployment = employment.includes('uop');
    titles.push(
      besideEmployment
        ? {
            name: 'Działalność gospodarcza (zbieg z etatem — tylko zdrowotne)',
            payer: 'Własna firma',
            since: '2024-02-01',
            sickness: 'none',
            contributionBase: 0,
          }
        : {
            name: 'Pozarolnicza działalność gospodarcza',
            payer: 'Własna firma (zasiłki wypłaca ZUS)',
            since: '2023-05-01',
            sickness: 'voluntary',
            contributionBase: extras?.contributionBase ?? params.businessStandardBase,
          },
    );
  }
  if (employment.includes('zlec')) {
    titles.push({ name: 'Umowa zlecenia', payer: 'Zleceniodawca', since: '2025-01-01', sickness: 'voluntary', contributionBase: 4500 });
  }

  return {
    titles,
    certificates: extras?.certificates ?? [],
    debt: extras?.debt ?? 0,
    hasSicknessInsurance: titles.some((t) => t.sickness === 'mandatory' || t.sickness === 'voluntary'),
  };
}
