package com.hn26.zaradniaki.zusbaby.legalrules.infrastructure.catalog;

import static com.hn26.zaradniaki.zusbaby.legalrules.api.model.ParameterKey.*;
import static java.util.Map.entry;

import com.hn26.zaradniaki.zusbaby.legalrules.domain.LegalParameters;
import com.hn26.zaradniaki.zusbaby.legalrules.domain.ParameterSet;
import com.hn26.zaradniaki.zusbaby.legalrules.domain.ParameterValue;
import java.time.LocalDate;
import java.util.Map;

/**
 * Version 1 of the legal parameters: legal state of 2026, same values as the
 * frontend prototype ({@code K} in {@code js/data.js}). A change in the law is
 * a new class with the next version, not an edit of this one.
 */
final class LegalState2026 {

    static final int VERSION = 1;
    static final LocalDate VALID_FROM = LocalDate.of(2026, 1, 1);
    static final String DESCRIPTION = "Ustawa zasiłkowa (Dz.U. 2026 poz. 854), Kodeks pracy (Dz.U. 2026 poz. 1245), "
            + "rozporządzenie z 27.09.2026 (Dz.U. 2026 poz. 1316), Poradnik ZUS dla rodziców i opiekunów dzieci 2026";

    private LegalState2026() {
    }

    static ParameterSet parameterSet() {
        return ParameterSet.of(VERSION, VALID_FROM, DESCRIPTION, new LegalParameters(Map.ofEntries(
                // amounts (PLN)
                entry(MINIMUM_WAGE, ParameterValue.of("4806")),
                entry(MINIMUM_BENEFIT_BASE, ParameterValue.of("4147.10")),
                entry(MAXIMUM_VOLUNTARY_BENEFIT_BASE, ParameterValue.of("20321.30")),
                entry(STANDARD_SELF_EMPLOYED_BASE, ParameterValue.of("5652")),
                entry(MINIMUM_MATERNITY_BENEFIT, ParameterValue.of("1000")),
                entry(FUNERAL_GRANT, ParameterValue.of("7000")),
                entry(DEBT_THRESHOLD, ParameterValue.of("48.06")),
                // rates
                entry(EMPLOYEE_CONTRIBUTION_RATE, ParameterValue.of("0.1371")),
                entry(DEBT_THRESHOLD_RATE, ParameterValue.of("0.01")),
                entry(MATERNITY_LEAVE_RATE, ParameterValue.of("1")),
                entry(PARENTAL_LEAVE_RATE, ParameterValue.of("0.7")),
                entry(AVERAGED_RATE, ParameterValue.of("0.815")),
                entry(SUPPLEMENTARY_LEAVE_RATE, ParameterValue.of("1")),
                entry(PATERNITY_LEAVE_RATE, ParameterValue.of("1")),
                entry(PREGNANCY_SICKNESS_RATE, ParameterValue.of("1")),
                entry(CARE_BENEFIT_RATE, ParameterValue.of("0.8")),
                entry(PREGNANCY_REHABILITATION_RATE, ParameterValue.of("1")),
                entry(INCOME_TAX_ADVANCE_RATE, ParameterValue.of("0.12")),
                // leave dimensions (weeks)
                entry(MATERNITY_LEAVE_WEEKS, ParameterValue.ofChildren(20, 31, 33, 35, 37)),
                entry(PARENTAL_ALLOWANCE_WEEKS, ParameterValue.ofChildren(52, 65, 67, 69, 71)),
                entry(PARENTAL_LEAVE_WEEKS_ONE_CHILD, ParameterValue.of("41")),
                entry(PARENTAL_LEAVE_WEEKS_MULTIPLE_CHILDREN, ParameterValue.of("43")),
                entry(PARENTAL_LEAVE_WEEKS_ZA_ZYCIEM_ONE_CHILD, ParameterValue.of("65")),
                entry(PARENTAL_LEAVE_WEEKS_ZA_ZYCIEM_MULTIPLE_CHILDREN, ParameterValue.of("67")),
                entry(PARENTAL_LEAVE_WITH_WORK_MAX_WEEKS_ONE_CHILD, ParameterValue.of("82")),
                entry(PARENTAL_LEAVE_WITH_WORK_MAX_WEEKS_MULTIPLE_CHILDREN, ParameterValue.of("86")),
                entry(PARENTAL_LEAVE_WITH_WORK_MAX_WEEKS_ZA_ZYCIEM_ONE_CHILD, ParameterValue.of("130")),
                entry(PARENTAL_LEAVE_WITH_WORK_MAX_WEEKS_ZA_ZYCIEM_MULTIPLE_CHILDREN, ParameterValue.of("134")),
                entry(NON_TRANSFERABLE_PARENTAL_WEEKS, ParameterValue.of("9")),
                entry(PATERNITY_LEAVE_WEEKS, ParameterValue.of("2")),
                entry(MOTHER_ONLY_MATERNITY_WEEKS, ParameterValue.of("14")),
                entry(MAX_MATERNITY_WEEKS_BEFORE_BIRTH, ParameterValue.of("6")),
                entry(ADOPTION_MINIMUM_WEEKS, ParameterValue.of("9")),
                entry(ADOPTION_PARENTAL_MINIMUM_WEEKS, ParameterValue.of("38")),
                entry(ADOPTION_PARENTAL_MINIMUM_WEEKS_ZA_ZYCIEM, ParameterValue.of("62")),
                entry(SUPPLEMENTARY_LEAVE_MAX_WEEKS_EXTREME_PRETERM, ParameterValue.of("15")),
                entry(SUPPLEMENTARY_LEAVE_MAX_WEEKS, ParameterValue.of("8")),
                // age limits (years)
                entry(FOSTER_CHILD_AGE_LIMIT, ParameterValue.of("7")),
                entry(FOSTER_CHILD_AGE_LIMIT_DEFERRED_SCHOOL, ParameterValue.of("10")),
                entry(ADOPTED_CHILD_AGE_LIMIT, ParameterValue.of("14")),
                // periods
                entry(PREGNANCY_BENEFIT_PERIOD_DAYS, ParameterValue.of("270")),
                entry(SICK_PAY_DAYS, ParameterValue.of("33")),
                entry(SICK_PAY_DAYS_AGE_50, ParameterValue.of("14")),
                entry(WAITING_PERIOD_MANDATORY_DAYS, ParameterValue.of("30")),
                entry(WAITING_PERIOD_VOLUNTARY_DAYS, ParameterValue.of("90")),
                entry(CARE_BENEFIT_DAYS_PER_YEAR, ParameterValue.of("60")),
                entry(REHABILITATION_MAX_MONTHS, ParameterValue.of("12")))));
    }
}
