package com.hn26.zaradniaki.zusbaby.shared.domain;

import java.math.BigDecimal;
import java.util.Objects;

/**
 * Fraction between 0 and 1, e.g. benefit rate 0.815 (81.5%) or contribution
 * rate 0.1371.
 */
public record Rate(BigDecimal value) {

    public static final Rate ZERO = new Rate(BigDecimal.ZERO);
    public static final Rate ONE = new Rate(BigDecimal.ONE);

    private static final BigDecimal HUNDRED = BigDecimal.valueOf(100);

    public Rate {
        Objects.requireNonNull(value, "value");
        if (value.signum() < 0 || value.compareTo(BigDecimal.ONE) > 0) {
            throw new IllegalArgumentException("Rate must be between 0 and 1, was " + value.toPlainString());
        }
        value = value.stripTrailingZeros();
        if (value.scale() < 0) {
            value = value.setScale(0);
        }
    }

    public static Rate of(String value) {
        return new Rate(new BigDecimal(value));
    }

    public static Rate ofPercent(String percent) {
        return new Rate(new BigDecimal(percent).divide(HUNDRED));
    }

    /** 1 − rate, e.g. the part of a benefit kept when working half time. */
    public Rate complement() {
        return new Rate(BigDecimal.ONE.subtract(value));
    }

    public Rate times(Rate other) {
        return new Rate(value.multiply(other.value));
    }

    public BigDecimal percent() {
        return value.multiply(HUNDRED).stripTrailingZeros();
    }

    @Override
    public String toString() {
        return percent().toPlainString() + "%";
    }
}
