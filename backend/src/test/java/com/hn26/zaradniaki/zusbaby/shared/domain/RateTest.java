package com.hn26.zaradniaki.zusbaby.shared.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatIllegalArgumentException;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class RateTest {

    @Test
    void createsFromFractionAndPercent() {
        assertThat(Rate.of("0.815")).isEqualTo(Rate.ofPercent("81.5"));
        assertThat(Rate.of("1.00")).isEqualTo(Rate.ONE);
    }

    @ParameterizedTest
    @ValueSource(strings = {"-0.01", "1.01", "2"})
    void rejectsValuesOutsideZeroToOne(String value) {
        assertThatIllegalArgumentException().isThrownBy(() -> Rate.of(value));
    }

    @Test
    void complementIsTheRestToOne() {
        assertThat(Rate.of("0.25").complement()).isEqualTo(Rate.of("0.75"));
        assertThat(Rate.ONE.complement()).isEqualTo(Rate.ZERO);
    }

    @Test
    void multipliesRates() {
        // 70% benefit while working half time = 35%
        assertThat(Rate.of("0.7").times(Rate.of("0.5"))).isEqualTo(Rate.of("0.35"));
    }

    @Test
    void printsAsPercent() {
        assertThat(Rate.of("0.815")).hasToString("81.5%");
        assertThat(Rate.of("0.1371").percent()).isEqualByComparingTo("13.71");
    }
}
