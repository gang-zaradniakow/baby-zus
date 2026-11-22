import type { EmploymentId } from './ParentProfile';

export type InsuranceFlags = {
  hasEmploymentContract: boolean;
  hasBusiness: boolean;
  hasCivilContract: boolean;
  /** Prawo do zasiłków z ZUS (macierzyński, chorobowy). Upraszczamy: każdy tytuł poza „brak”. */
  hasSicknessInsurance: boolean;
};

export function getInsuranceFlags(employment: readonly EmploymentId[]): InsuranceFlags {
  const hasEmploymentContract = employment.includes('uop');
  const hasBusiness = employment.includes('jdg');
  const hasCivilContract = employment.includes('zlec');

  return {
    hasEmploymentContract,
    hasBusiness,
    hasCivilContract,
    hasSicknessInsurance: hasEmploymentContract || hasBusiness || hasCivilContract,
  };
}
