package com.hn26.zaradniaki.zusbaby.shared.mapping;

import com.hn26.zaradniaki.zusbaby.shared.domain.Money;
import com.hn26.zaradniaki.zusbaby.shared.domain.Rate;
import com.hn26.zaradniaki.zusbaby.shared.domain.Weeks;
import java.math.BigDecimal;

/**
 * Conversions between shared kernel value objects and their wire/persistence
 * forms. Static, so MapStruct calls them directly. Money travels as a decimal
 * string in the API ("4147.10"), rates and weeks as numbers. {@code null} stays
 * {@code null}; whether a value is required is decided by validation, not by
 * the mapper.
 */
public final class ValueObjectMappers {

    private ValueObjectMappers() {
    }

    public static Money toMoney(String amount) {
        return amount == null ? null : Money.of(amount);
    }

    public static Money toMoney(BigDecimal amount) {
        return amount == null ? null : new Money(amount);
    }

    /**
     * Wire format: amount rounded to grosze, always with two decimal places
     * ("1000.00").
     */
    public static String toAmountString(Money money) {
        return money == null ? null : money.rounded().amount().setScale(2).toPlainString();
    }

    public static BigDecimal toBigDecimal(Money money) {
        return money == null ? null : money.amount();
    }

    public static Rate toRate(BigDecimal value) {
        return value == null ? null : new Rate(value);
    }

    public static BigDecimal toBigDecimal(Rate rate) {
        return rate == null ? null : rate.value();
    }

    public static Weeks toWeeks(BigDecimal value) {
        return value == null ? null : new Weeks(value);
    }

    public static Weeks toWeeks(Integer value) {
        return value == null ? null : Weeks.of(value);
    }

    /** Whole weeks on the wire (leave dimensions); fails for a fractional value. */
    public static Integer toInteger(Weeks weeks) {
        return weeks == null ? null : weeks.value().intValueExact();
    }

    public static BigDecimal toBigDecimal(Weeks weeks) {
        return weeks == null ? null : weeks.value();
    }
}
