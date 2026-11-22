import type { LegalParams } from '@/data/legalParams';

import type { LegalParameterDto, LegalParametersResponse } from './LegalParametersResponse';

/**
 * Zamienia listę parametrów z backendu (klucze `MINIMUM_WAGE`…) na model `LegalParams`, z którego liczą
 * kalkulatory. Brak któregoś klucza to błąd kontraktu — wtedy aplikacja zostaje przy wartościach lokalnych.
 */
export function toLegalParams(response: LegalParametersResponse): LegalParams {
  const byKey = new Map<string, LegalParameterDto>(response.parameters.map((p) => [p.key, p]));
  const find = (key: string) => {
    const parameter = byKey.get(key);
    if (!parameter) throw new Error(`Brak parametru prawnego ${key}`);
    return parameter;
  };
  const value = (key: string) => {
    const v = find(key).value;
    if (v === undefined) throw new Error(`Parametr ${key} nie ma wartości`);
    return Number(v);
  };
  const values = (key: string) => {
    const v = find(key).values;
    if (!v?.length) throw new Error(`Parametr ${key} nie ma wartości wg liczby dzieci`);
    return v.map(Number);
  };

  return {
    minWage: value('MINIMUM_WAGE'),
    socialContributionRate: value('EMPLOYEE_CONTRIBUTION_RATE'),
    minBenefitBase: value('MINIMUM_BENEFIT_BASE'),
    maxVoluntaryBase: value('MAXIMUM_VOLUNTARY_BENEFIT_BASE'),
    businessStandardBase: value('STANDARD_SELF_EMPLOYED_BASE'),
    parentalBenefitMonthly: value('MINIMUM_MATERNITY_BENEFIT'),
    parentalBenefitWeeks: values('PARENTAL_ALLOWANCE_WEEKS'),
    debtLimit: value('DEBT_THRESHOLD'),
    pitRate: value('INCOME_TAX_ADVANCE_RATE'),
    funeralAllowance: value('FUNERAL_GRANT'),
    rates: {
      maternity: value('MATERNITY_LEAVE_RATE'),
      parental: value('PARENTAL_LEAVE_RATE'),
      averaged: value('AVERAGED_RATE'),
      supplementary: value('SUPPLEMENTARY_LEAVE_RATE'),
      paternity: value('PATERNITY_LEAVE_RATE'),
      pregnancySickness: value('PREGNANCY_SICKNESS_RATE'),
      pregnancyRehabilitation: value('PREGNANCY_REHABILITATION_RATE'),
    },
    maternityWeeks: values('MATERNITY_LEAVE_WEEKS'),
    parentalWeeks: {
      single: value('PARENTAL_LEAVE_WEEKS_ONE_CHILD'),
      multiple: value('PARENTAL_LEAVE_WEEKS_MULTIPLE_CHILDREN'),
      zaZyciemSingle: value('PARENTAL_LEAVE_WEEKS_ZA_ZYCIEM_ONE_CHILD'),
      zaZyciemMultiple: value('PARENTAL_LEAVE_WEEKS_ZA_ZYCIEM_MULTIPLE_CHILDREN'),
    },
    parentalWeeksWithWorkMax: {
      single: value('PARENTAL_LEAVE_WITH_WORK_MAX_WEEKS_ONE_CHILD'),
      multiple: value('PARENTAL_LEAVE_WITH_WORK_MAX_WEEKS_MULTIPLE_CHILDREN'),
      zaZyciemSingle: value('PARENTAL_LEAVE_WITH_WORK_MAX_WEEKS_ZA_ZYCIEM_ONE_CHILD'),
      zaZyciemMultiple: value('PARENTAL_LEAVE_WITH_WORK_MAX_WEEKS_ZA_ZYCIEM_MULTIPLE_CHILDREN'),
    },
    nonTransferableWeeks: value('NON_TRANSFERABLE_PARENTAL_WEEKS'),
    paternityWeeks: value('PATERNITY_LEAVE_WEEKS'),
    motherOnlyMaternityWeeks: value('MOTHER_ONLY_MATERNITY_WEEKS'),
    adoption: {
      minWeeks: value('ADOPTION_MINIMUM_WEEKS'),
      parentalMinWeeks: value('ADOPTION_PARENTAL_MINIMUM_WEEKS'),
      parentalMinWeeksZaZyciem: value('ADOPTION_PARENTAL_MINIMUM_WEEKS_ZA_ZYCIEM'),
      ageLimitAdoption: value('ADOPTED_CHILD_AGE_LIMIT'),
      ageLimitFoster: value('FOSTER_CHILD_AGE_LIMIT'),
      ageLimitFosterDeferredSchool: value('FOSTER_CHILD_AGE_LIMIT_DEFERRED_SCHOOL'),
    },
    supplementaryMaxWeeks: {
      veryPreterm: value('SUPPLEMENTARY_LEAVE_MAX_WEEKS_EXTREME_PRETERM'),
      preterm: value('SUPPLEMENTARY_LEAVE_MAX_WEEKS'),
    },
    sickness: {
      pregnancyPeriodDays: value('PREGNANCY_BENEFIT_PERIOD_DAYS'),
      employerPaidDays: value('SICK_PAY_DAYS'),
      employerPaidDaysAge50: value('SICK_PAY_DAYS_AGE_50'),
      waitingDaysMandatory: value('WAITING_PERIOD_MANDATORY_DAYS'),
      waitingDaysVoluntary: value('WAITING_PERIOD_VOLUNTARY_DAYS'),
      rehabilitationMaxMonths: value('REHABILITATION_MAX_MONTHS'),
    },
  };
}
