package com.hn26.zaradniaki.zusbaby.shared.domain;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Objects;

/**
 * Non-negative number of weeks. May be fractional: combining parental leave
 * with part-time work extends the leave by a fraction of a week.
 */
public record Weeks(BigDecimal value) implements Comparable<Weeks> {

    public static final Weeks ZERO = new Weeks(BigDecimal.ZERO);

    private static final BigDecimal DAYS_IN_WEEK = BigDecimal.valueOf(7);

    public Weeks {
        Objects.requireNonNull(value, "value");
        if (value.signum() < 0) {
            throw new IllegalArgumentException("Weeks must not be negative, was " + value.toPlainString());
        }
        value = value.stripTrailingZeros();
        if (value.scale() < 0) {
            value = value.setScale(0);
        }
    }

    public static Weeks of(long weeks) {
        return new Weeks(BigDecimal.valueOf(weeks));
    }

    public static Weeks of(String weeks) {
        return new Weeks(new BigDecimal(weeks));
    }

    /** Whole calendar days (half up), as used on the leave timeline. */
    public long toDays() {
        return value.multiply(DAYS_IN_WEEK).setScale(0, RoundingMode.HALF_UP).longValueExact();
    }

    public Weeks plus(Weeks other) {
        return new Weeks(value.add(other.value));
    }

    /** Difference; fails when the result would be negative. */
    public Weeks minus(Weeks other) {
        return new Weeks(value.subtract(other.value));
    }

    public Weeks times(Rate rate) {
        return new Weeks(value.multiply(rate.value()));
    }

    public Weeks min(Weeks other) {
        return compareTo(other) <= 0 ? this : other;
    }

    public Weeks max(Weeks other) {
        return compareTo(other) >= 0 ? this : other;
    }

    public boolean isZero() {
        return value.signum() == 0;
    }

    @Override
    public int compareTo(Weeks other) {
        return value.compareTo(other.value);
    }

    @Override
    public String toString() {
        return value.toPlainString() + " wk";
    }
}
