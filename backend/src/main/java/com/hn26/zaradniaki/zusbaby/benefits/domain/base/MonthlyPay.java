package com.hn26.zaradniaki.zusbaby.benefits.domain.base;

import com.hn26.zaradniaki.zusbaby.shared.domain.Money;
import java.util.Objects;

/**
 * Gross pay of one month from the payer's certificate (Z-3 / Z-3a).
 * @param amount gross pay
 * @param skip less than half of the working time in the month: left out of the
 *            average
 */
public record MonthlyPay(Money amount, boolean skip) {

    public MonthlyPay {
        Objects.requireNonNull(amount, "amount");
    }

    boolean counts() {
        return !skip && amount.isGreaterThan(Money.ZERO);
    }
}
