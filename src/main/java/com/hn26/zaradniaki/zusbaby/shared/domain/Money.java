package com.hn26.zaradniaki.zusbaby.shared.domain;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.util.Objects;

/**
 * Amount in PLN. Arithmetic keeps full precision (benefits are computed from
 * daily rates), so only presentation and final results should call
 * {@link #rounded()}. Amounts may be negative (e.g. differences).
 */
public record Money(BigDecimal amount) implements Comparable<Money> {

    public static final Money ZERO = new Money(BigDecimal.ZERO);

    private static final MathContext PRECISION = MathContext.DECIMAL64;

    public Money {
        Objects.requireNonNull(amount, "amount");
        amount = normalize(amount);
    }

    public static Money of(String amount) {
        return new Money(new BigDecimal(amount));
    }

    public static Money of(long amount) {
        return new Money(BigDecimal.valueOf(amount));
    }

    public Money plus(Money other) {
        return new Money(amount.add(other.amount, PRECISION));
    }

    public Money minus(Money other) {
        return new Money(amount.subtract(other.amount, PRECISION));
    }

    public Money times(Rate rate) {
        return times(rate.value());
    }

    public Money times(BigDecimal factor) {
        return new Money(amount.multiply(factor, PRECISION));
    }

    public Money times(long factor) {
        return times(BigDecimal.valueOf(factor));
    }

    public Money dividedBy(long divisor) {
        if (divisor == 0) {
            throw new IllegalArgumentException("Cannot divide money by zero");
        }
        return new Money(amount.divide(BigDecimal.valueOf(divisor), PRECISION));
    }

    /** Amount rounded to grosze (2 decimal places, half up). */
    public Money rounded() {
        return new Money(amount.setScale(2, RoundingMode.HALF_UP));
    }

    public boolean isZero() {
        return amount.signum() == 0;
    }

    public boolean isNegative() {
        return amount.signum() < 0;
    }

    public boolean isGreaterThan(Money other) {
        return compareTo(other) > 0;
    }

    public boolean isLessThan(Money other) {
        return compareTo(other) < 0;
    }

    public Money max(Money other) {
        return isLessThan(other) ? other : this;
    }

    public Money min(Money other) {
        return isGreaterThan(other) ? other : this;
    }

    @Override
    public int compareTo(Money other) {
        return amount.compareTo(other.amount);
    }

    @Override
    public String toString() {
        return amount.toPlainString();
    }

    /**
     * Same value always has the same representation, so record equality ignores
     * scale ("2.50" equals "2.5").
     */
    private static BigDecimal normalize(BigDecimal value) {
        BigDecimal stripped = value.stripTrailingZeros();
        return stripped.scale() < 0 ? stripped.setScale(0) : stripped;
    }
}
