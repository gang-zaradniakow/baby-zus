package com.hn26.zaradniaki.zusbaby.legalrules.domain;

import com.hn26.zaradniaki.zusbaby.legalrules.api.model.ParameterKey;
import com.hn26.zaradniaki.zusbaby.legalrules.api.model.ParameterKind;
import com.hn26.zaradniaki.zusbaby.shared.domain.Money;
import com.hn26.zaradniaki.zusbaby.shared.domain.Rate;
import com.hn26.zaradniaki.zusbaby.shared.domain.Weeks;
import java.math.BigDecimal;
import java.util.Collections;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Complete, validated set of legal parameter values: the published language of
 * this module, used by every calculation. Always contains every
 * {@link ParameterKey}, each value fitting its kind.
 */
public final class LegalParameters {

    private final Map<ParameterKey, ParameterValue> values;

    public LegalParameters(Map<ParameterKey, ? extends ParameterValue> values) {
        Set<ParameterKey> missing = EnumSet.allOf(ParameterKey.class);
        missing.removeAll(values.keySet());
        if (!missing.isEmpty()) {
            throw new InvalidLegalParametersException("Brakuje parametrów: " + missing.stream()
                    .map(ParameterKey::label).collect(Collectors.joining(", ")) + ".");
        }
        values.forEach((key, value) -> value.validateFor(key));
        this.values = Collections.unmodifiableMap(new EnumMap<>(values));
    }

    public Map<ParameterKey, ParameterValue> asMap() {
        return values;
    }

    public ParameterValue value(ParameterKey key) {
        return values.get(key);
    }

    public Money amount(ParameterKey key) {
        return new Money(single(key, ParameterKind.AMOUNT));
    }

    public Rate rate(ParameterKey key) {
        return new Rate(single(key, ParameterKind.RATE));
    }

    public Weeks weeks(ParameterKey key) {
        return new Weeks(single(key, ParameterKind.WEEKS));
    }

    public int days(ParameterKey key) {
        return single(key, ParameterKind.DAYS).intValueExact();
    }

    public int months(ParameterKey key) {
        return single(key, ParameterKind.MONTHS).intValueExact();
    }

    public int years(ParameterKey key) {
        return single(key, ParameterKind.YEARS).intValueExact();
    }

    /**
     * Weeks of a {@link ParameterKind#WEEKS_BY_CHILDREN} parameter for the given
     * number of children (5+ = 5).
     */
    public Weeks weeksForChildren(ParameterKey key, int children) {
        requireKind(key, ParameterKind.WEEKS_BY_CHILDREN);
        return new Weeks(((ParameterValue.ByChildren) values.get(key)).forChildren(children));
    }

    /** Maternity leave: 20, 31, 33, 35, 37 weeks for 1–5+ children. */
    public Weeks maternityLeaveWeeks(int children) {
        return weeksForChildren(ParameterKey.MATERNITY_LEAVE_WEEKS, children);
    }

    /**
     * Parental leave: 41 / 43 weeks, or 65 / 67 with the "Za życiem" certificate.
     */
    public Weeks parentalLeaveWeeks(int children, boolean zaZyciem) {
        boolean multiple = children > 1;
        if (zaZyciem) {
            return weeks(multiple
                    ? ParameterKey.PARENTAL_LEAVE_WEEKS_ZA_ZYCIEM_MULTIPLE_CHILDREN
                    : ParameterKey.PARENTAL_LEAVE_WEEKS_ZA_ZYCIEM_ONE_CHILD);
        }
        return weeks(multiple
                ? ParameterKey.PARENTAL_LEAVE_WEEKS_MULTIPLE_CHILDREN
                : ParameterKey.PARENTAL_LEAVE_WEEKS_ONE_CHILD);
    }

    /**
     * Longest parental leave when combined with part-time work: 82 / 86, or 130 /
     * 134 with "Za życiem".
     */
    public Weeks parentalLeaveWithWorkMaxWeeks(int children, boolean zaZyciem) {
        boolean multiple = children > 1;
        if (zaZyciem) {
            return weeks(multiple
                    ? ParameterKey.PARENTAL_LEAVE_WITH_WORK_MAX_WEEKS_ZA_ZYCIEM_MULTIPLE_CHILDREN
                    : ParameterKey.PARENTAL_LEAVE_WITH_WORK_MAX_WEEKS_ZA_ZYCIEM_ONE_CHILD);
        }
        return weeks(multiple
                ? ParameterKey.PARENTAL_LEAVE_WITH_WORK_MAX_WEEKS_MULTIPLE_CHILDREN
                : ParameterKey.PARENTAL_LEAVE_WITH_WORK_MAX_WEEKS_ONE_CHILD);
    }

    private BigDecimal single(ParameterKey key, ParameterKind expected) {
        requireKind(key, expected);
        return ((ParameterValue.Single) values.get(key)).value();
    }

    private static void requireKind(ParameterKey key, ParameterKind expected) {
        if (key.kind() != expected) {
            throw new IllegalArgumentException(key + " is " + key.kind() + ", not " + expected);
        }
    }

    @Override
    public boolean equals(Object other) {
        return other instanceof LegalParameters that && values.equals(that.values);
    }

    @Override
    public int hashCode() {
        return values.hashCode();
    }

    @Override
    public String toString() {
        return "LegalParameters" + values;
    }
}
