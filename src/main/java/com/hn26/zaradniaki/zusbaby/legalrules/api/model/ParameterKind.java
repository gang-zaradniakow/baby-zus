package com.hn26.zaradniaki.zusbaby.legalrules.api.model;

/**
 * What a legal parameter measures; decides how its value is validated and read.
 */
public enum ParameterKind {

    /** Amount in PLN, not negative. */
    AMOUNT,
    /** Fraction between 0 and 1 (0.815 = 81.5%). */
    RATE,
    /** Whole number of weeks. */
    WEEKS,
    /** Whole number of days. */
    DAYS,
    /** Whole number of months. */
    MONTHS,
    /** Whole number of years (age limits). */
    YEARS,
    /** Five whole numbers of weeks: for 1, 2, 3, 4 and 5 or more children. */
    WEEKS_BY_CHILDREN;

    public boolean isWholeNumber() {
        return this == WEEKS || this == DAYS || this == MONTHS || this == YEARS || this == WEEKS_BY_CHILDREN;
    }
}
