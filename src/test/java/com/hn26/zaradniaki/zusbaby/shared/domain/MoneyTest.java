package com.hn26.zaradniaki.zusbaby.shared.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatIllegalArgumentException;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

class MoneyTest {

    @Test
    void equalityIgnoresScale() {
        assertThat(Money.of("2.50")).isEqualTo(Money.of("2.5"));
        assertThat(Money.of("100.00")).isEqualTo(Money.of(100));
        assertThat(Money.of("100.00").hashCode()).isEqualTo(Money.of(100).hashCode());
    }

    @Test
    void printsPlainNumber() {
        assertThat(Money.of("4806.00")).hasToString("4806");
        assertThat(Money.of("4147.10")).hasToString("4147.1");
    }

    @Test
    void addsAndSubtracts() {
        assertThat(Money.of("62.40").minus(Money.of("48.06"))).isEqualTo(Money.of("14.34"));
        assertThat(Money.of("1000").plus(Money.of("0.01"))).isEqualTo(Money.of("1000.01"));
    }

    @Test
    void appliesRateWithoutRounding() {
        // 4806 * (1 - 13.71%) = 4147.0974 -> rounded only on demand
        Money base = Money.of(4806).times(Rate.of("0.1371").complement());

        assertThat(base).isEqualTo(Money.of("4147.0974"));
        assertThat(base.rounded()).isEqualTo(Money.of("4147.10"));
    }

    @ParameterizedTest
    @CsvSource({"6000, 30, 200", "4147.10, 30, 138.2366666666667", "100, 3, 33.33333333333333"})
    void dividesWithHighPrecision(String amount, long divisor, String expected) {
        assertThat(Money.of(amount).dividedBy(divisor)).isEqualTo(Money.of(expected));
    }

    @Test
    void rejectsDivisionByZero() {
        assertThatIllegalArgumentException().isThrownBy(() -> Money.of(10).dividedBy(0));
    }

    @ParameterizedTest
    @CsvSource({"0.005, 0.01", "0.004, 0", "-0.005, -0.01", "1234.565, 1234.57"})
    void roundsHalfUpToGrosze(String amount, String expected) {
        assertThat(Money.of(amount).rounded()).isEqualTo(Money.of(expected));
    }

    @Test
    void comparesAmounts() {
        Money debt = Money.of("62.40");
        Money limit = Money.of("48.06");

        assertThat(debt.isGreaterThan(limit)).isTrue();
        assertThat(limit.isLessThan(debt)).isTrue();
        assertThat(debt.max(limit)).isEqualTo(debt);
        assertThat(debt.min(limit)).isEqualTo(limit);
        assertThat(Money.ZERO.isZero()).isTrue();
        assertThat(limit.minus(debt).isNegative()).isTrue();
    }
}
