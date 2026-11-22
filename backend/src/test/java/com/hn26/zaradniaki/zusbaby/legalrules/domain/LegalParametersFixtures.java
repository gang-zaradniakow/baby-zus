package com.hn26.zaradniaki.zusbaby.legalrules.domain;

import static java.util.Map.entry;

import com.hn26.zaradniaki.zusbaby.legalrules.api.model.ParameterKey;
import java.util.EnumMap;
import java.util.Map;

/**
 * Default parameter values (version 1, same as migration V2 and the frontend
 * prototype). For tests in any module that need {@link LegalParameters} without
 * a database. {@code LegalParametersIT} checks that the migration matches.
 */
public final class LegalParametersFixtures {

    public static final Map<ParameterKey, String> DEFAULT_VALUES = Map.ofEntries(
            entry(ParameterKey.MINIMUM_WAGE, "4806"),
            entry(ParameterKey.MINIMUM_BENEFIT_BASE, "4147.10"),
            entry(ParameterKey.MAXIMUM_VOLUNTARY_BENEFIT_BASE, "20321.30"),
            entry(ParameterKey.STANDARD_SELF_EMPLOYED_BASE, "5652"),
            entry(ParameterKey.MINIMUM_MATERNITY_BENEFIT, "1000"),
            entry(ParameterKey.FUNERAL_GRANT, "7000"),
            entry(ParameterKey.DEBT_THRESHOLD, "48.06"),
            entry(ParameterKey.EMPLOYEE_CONTRIBUTION_RATE, "0.1371"),
            entry(ParameterKey.DEBT_THRESHOLD_RATE, "0.01"),
            entry(ParameterKey.MATERNITY_LEAVE_RATE, "1"),
            entry(ParameterKey.PARENTAL_LEAVE_RATE, "0.7"),
            entry(ParameterKey.AVERAGED_RATE, "0.815"),
            entry(ParameterKey.SUPPLEMENTARY_LEAVE_RATE, "1"),
            entry(ParameterKey.PATERNITY_LEAVE_RATE, "1"),
            entry(ParameterKey.PREGNANCY_SICKNESS_RATE, "1"),
            entry(ParameterKey.CARE_BENEFIT_RATE, "0.8"),
            entry(ParameterKey.PREGNANCY_REHABILITATION_RATE, "1"),
            entry(ParameterKey.INCOME_TAX_ADVANCE_RATE, "0.12"),
            entry(ParameterKey.MATERNITY_LEAVE_WEEKS, "20,31,33,35,37"),
            entry(ParameterKey.PARENTAL_ALLOWANCE_WEEKS, "52,65,67,69,71"),
            entry(ParameterKey.PARENTAL_LEAVE_WEEKS_ONE_CHILD, "41"),
            entry(ParameterKey.PARENTAL_LEAVE_WEEKS_MULTIPLE_CHILDREN, "43"),
            entry(ParameterKey.PARENTAL_LEAVE_WEEKS_ZA_ZYCIEM_ONE_CHILD, "65"),
            entry(ParameterKey.PARENTAL_LEAVE_WEEKS_ZA_ZYCIEM_MULTIPLE_CHILDREN, "67"),
            entry(ParameterKey.PARENTAL_LEAVE_WITH_WORK_MAX_WEEKS_ONE_CHILD, "82"),
            entry(ParameterKey.PARENTAL_LEAVE_WITH_WORK_MAX_WEEKS_MULTIPLE_CHILDREN, "86"),
            entry(ParameterKey.PARENTAL_LEAVE_WITH_WORK_MAX_WEEKS_ZA_ZYCIEM_ONE_CHILD, "130"),
            entry(ParameterKey.PARENTAL_LEAVE_WITH_WORK_MAX_WEEKS_ZA_ZYCIEM_MULTIPLE_CHILDREN, "134"),
            entry(ParameterKey.NON_TRANSFERABLE_PARENTAL_WEEKS, "9"),
            entry(ParameterKey.PATERNITY_LEAVE_WEEKS, "2"),
            entry(ParameterKey.MOTHER_ONLY_MATERNITY_WEEKS, "14"),
            entry(ParameterKey.MAX_MATERNITY_WEEKS_BEFORE_BIRTH, "6"),
            entry(ParameterKey.ADOPTION_MINIMUM_WEEKS, "9"),
            entry(ParameterKey.ADOPTION_PARENTAL_MINIMUM_WEEKS, "38"),
            entry(ParameterKey.ADOPTION_PARENTAL_MINIMUM_WEEKS_ZA_ZYCIEM, "62"),
            entry(ParameterKey.SUPPLEMENTARY_LEAVE_MAX_WEEKS_EXTREME_PRETERM, "15"),
            entry(ParameterKey.SUPPLEMENTARY_LEAVE_MAX_WEEKS, "8"),
            entry(ParameterKey.FOSTER_CHILD_AGE_LIMIT, "7"),
            entry(ParameterKey.FOSTER_CHILD_AGE_LIMIT_DEFERRED_SCHOOL, "10"),
            entry(ParameterKey.ADOPTED_CHILD_AGE_LIMIT, "14"),
            entry(ParameterKey.PREGNANCY_BENEFIT_PERIOD_DAYS, "270"),
            entry(ParameterKey.SICK_PAY_DAYS, "33"),
            entry(ParameterKey.SICK_PAY_DAYS_AGE_50, "14"),
            entry(ParameterKey.WAITING_PERIOD_MANDATORY_DAYS, "30"),
            entry(ParameterKey.WAITING_PERIOD_VOLUNTARY_DAYS, "90"),
            entry(ParameterKey.CARE_BENEFIT_DAYS_PER_YEAR, "60"),
            entry(ParameterKey.REHABILITATION_MAX_MONTHS, "12"));

    private LegalParametersFixtures() {
    }

    public static LegalParameters defaults() {
        return withOverrides(Map.of());
    }

    /** Defaults with some values replaced, e.g. a different parental leave rate. */
    public static LegalParameters withOverrides(Map<ParameterKey, String> overrides) {
        Map<ParameterKey, ParameterValue> values = new EnumMap<>(ParameterKey.class);
        DEFAULT_VALUES.forEach(
                (key, text) -> values.put(key, ParameterValue.parse(key, overrides.getOrDefault(key, text))));
        return new LegalParameters(values);
    }
}
