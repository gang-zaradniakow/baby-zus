package com.hn26.zaradniaki.zusbaby.benefits;

import static org.assertj.core.api.Assertions.assertThat;

import com.hn26.zaradniaki.zusbaby.shared.domain.Money;
import java.math.BigDecimal;

/**
 * Amounts from the prototype are JavaScript doubles: compare with a tolerance
 * of one grosz.
 */
public final class GoldenMoney {

    private static final BigDecimal TOLERANCE = new BigDecimal("0.01");

    private GoldenMoney() {
    }

    public static void assertMoney(Money actual, BigDecimal expected, String what) {
        assertThat(actual.amount().subtract(expected).abs()).as("%s: %s vs prototype %s", what, actual, expected)
                .isLessThanOrEqualTo(TOLERANCE);
    }
}
