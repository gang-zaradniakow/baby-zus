import { LEGAL_PARAMS, type LegalParams } from '@/data/legalParams';

import type { LegalParameterDto, LegalParametersResponse } from './apiTypes';

type Setter = (params: LegalParams, parameter: LegalParameterDto) => LegalParams | null;

/** Wartość jednoliczbowa; `null` — brak albo nieliczba (wtedy zostaje wartość lokalna). */
const single = (parameter: LegalParameterDto) => (typeof parameter.value === 'number' ? parameter.value : null);

const top =
  (field: keyof LegalParams): Setter =>
  (params, parameter) => {
    const value = single(parameter);
    return value === null ? null : { ...params, [field]: value };
  };

const nested =
  <G extends 'rates' | 'parentalWeeks' | 'parentalWeeksWithWorkMax' | 'adoption' | 'supplementaryMaxWeeks' | 'sickness'>(
    group: G,
    field: keyof LegalParams[G],
  ): Setter =>
  (params, parameter) => {
    const value = single(parameter);
    return value === null ? null : { ...params, [group]: { ...params[group], [field]: value } };
  };

const byChildren =
  (field: 'maternityWeeks' | 'parentalBenefitWeeks'): Setter =>
  (params, parameter) =>
    parameter.values?.length === 5 && parameter.values.every((v) => typeof v === 'number')
      ? { ...params, [field]: [...parameter.values] }
      : null;

/**
 * Klucze backendu (`ParameterKey` w baby-zus-backend) → pola `LegalParams`. Klucze, których kalkulatory
 * frontendu nie używają (np. CARE_BENEFIT_RATE, DEBT_THRESHOLD_RATE), są pomijane.
 */
const SETTERS: Record<string, Setter> = {
  MINIMUM_WAGE: top('minWage'),
  MINIMUM_BENEFIT_BASE: top('minBenefitBase'),
  MAXIMUM_VOLUNTARY_BENEFIT_BASE: top('maxVoluntaryBase'),
  STANDARD_SELF_EMPLOYED_BASE: top('businessStandardBase'),
  MINIMUM_MATERNITY_BENEFIT: top('parentalBenefitMonthly'),
  FUNERAL_GRANT: top('funeralAllowance'),
  DEBT_THRESHOLD: top('debtLimit'),
  EMPLOYEE_CONTRIBUTION_RATE: top('socialContributionRate'),
  INCOME_TAX_ADVANCE_RATE: top('pitRate'),
  MATERNITY_LEAVE_RATE: nested('rates', 'maternity'),
  PARENTAL_LEAVE_RATE: nested('rates', 'parental'),
  AVERAGED_RATE: nested('rates', 'averaged'),
  SUPPLEMENTARY_LEAVE_RATE: nested('rates', 'supplementary'),
  PATERNITY_LEAVE_RATE: nested('rates', 'paternity'),
  PREGNANCY_SICKNESS_RATE: nested('rates', 'pregnancySickness'),
  PREGNANCY_REHABILITATION_RATE: nested('rates', 'pregnancyRehabilitation'),
  MATERNITY_LEAVE_WEEKS: byChildren('maternityWeeks'),
  PARENTAL_ALLOWANCE_WEEKS: byChildren('parentalBenefitWeeks'),
  PARENTAL_LEAVE_WEEKS_ONE_CHILD: nested('parentalWeeks', 'single'),
  PARENTAL_LEAVE_WEEKS_MULTIPLE_CHILDREN: nested('parentalWeeks', 'multiple'),
  PARENTAL_LEAVE_WEEKS_ZA_ZYCIEM_ONE_CHILD: nested('parentalWeeks', 'zaZyciemSingle'),
  PARENTAL_LEAVE_WEEKS_ZA_ZYCIEM_MULTIPLE_CHILDREN: nested('parentalWeeks', 'zaZyciemMultiple'),
  PARENTAL_LEAVE_WITH_WORK_MAX_WEEKS_ONE_CHILD: nested('parentalWeeksWithWorkMax', 'single'),
  PARENTAL_LEAVE_WITH_WORK_MAX_WEEKS_MULTIPLE_CHILDREN: nested('parentalWeeksWithWorkMax', 'multiple'),
  PARENTAL_LEAVE_WITH_WORK_MAX_WEEKS_ZA_ZYCIEM_ONE_CHILD: nested('parentalWeeksWithWorkMax', 'zaZyciemSingle'),
  PARENTAL_LEAVE_WITH_WORK_MAX_WEEKS_ZA_ZYCIEM_MULTIPLE_CHILDREN: nested('parentalWeeksWithWorkMax', 'zaZyciemMultiple'),
  NON_TRANSFERABLE_PARENTAL_WEEKS: top('nonTransferableWeeks'),
  PATERNITY_LEAVE_WEEKS: top('paternityWeeks'),
  MOTHER_ONLY_MATERNITY_WEEKS: top('motherOnlyMaternityWeeks'),
  ADOPTION_MINIMUM_WEEKS: nested('adoption', 'minWeeks'),
  ADOPTION_PARENTAL_MINIMUM_WEEKS: nested('adoption', 'parentalMinWeeks'),
  ADOPTION_PARENTAL_MINIMUM_WEEKS_ZA_ZYCIEM: nested('adoption', 'parentalMinWeeksZaZyciem'),
  ADOPTED_CHILD_AGE_LIMIT: nested('adoption', 'ageLimitAdoption'),
  FOSTER_CHILD_AGE_LIMIT: nested('adoption', 'ageLimitFoster'),
  FOSTER_CHILD_AGE_LIMIT_DEFERRED_SCHOOL: nested('adoption', 'ageLimitFosterDeferredSchool'),
  SUPPLEMENTARY_LEAVE_MAX_WEEKS_EXTREME_PRETERM: nested('supplementaryMaxWeeks', 'veryPreterm'),
  SUPPLEMENTARY_LEAVE_MAX_WEEKS: nested('supplementaryMaxWeeks', 'preterm'),
  PREGNANCY_BENEFIT_PERIOD_DAYS: nested('sickness', 'pregnancyPeriodDays'),
  SICK_PAY_DAYS: nested('sickness', 'employerPaidDays'),
  SICK_PAY_DAYS_AGE_50: nested('sickness', 'employerPaidDaysAge50'),
  WAITING_PERIOD_MANDATORY_DAYS: nested('sickness', 'waitingDaysMandatory'),
  WAITING_PERIOD_VOLUNTARY_DAYS: nested('sickness', 'waitingDaysVoluntary'),
  REHABILITATION_MAX_MONTHS: nested('sickness', 'rehabilitationMaxMonths'),
};

/** Klucze, które kalkulatory frontendu muszą dostać z serwera. */
export const REQUIRED_PARAMETER_KEYS: readonly string[] = Object.keys(SETTERS);

export type MappedLegalParameters = {
  params: LegalParams;
  version: number;
  validFrom: string;
  description: string;
  /** Klucze, których serwer nie podał albo podał w złym formacie — dla nich zostaje wartość lokalna. */
  missingKeys: string[];
};

/** Odpowiedź `GET /api/v1/legal-parameters` → parametry kalkulatorów (brakujące uzupełnione lokalnymi). */
export function mapLegalParameters(
  response: LegalParametersResponse,
  fallback: LegalParams = LEGAL_PARAMS,
): MappedLegalParameters {
  let params = fallback;
  const applied = new Set<string>();
  for (const parameter of response.parameters) {
    const next = SETTERS[parameter.key]?.(params, parameter);
    if (next) {
      params = next;
      applied.add(parameter.key);
    }
  }
  return {
    params,
    version: response.version,
    validFrom: response.validFrom,
    description: response.description,
    missingKeys: REQUIRED_PARAMETER_KEYS.filter((key) => !applied.has(key)),
  };
}
