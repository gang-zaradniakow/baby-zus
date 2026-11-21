package com.hn26.zaradniaki.zusbaby.shared.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatIllegalArgumentException;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

class WeeksTest {

    @ParameterizedTest
    @CsvSource({"20, 140", "0.5, 4", "4.1, 29", "0, 0", "0.2, 1"})
    void convertsToWholeDaysHalfUp(String weeks, long days) {
        assertThat(Weeks.of(weeks).toDays()).isEqualTo(days);
    }

    @Test
    void rejectsNegativeWeeks() {
        assertThatIllegalArgumentException().isThrownBy(() -> Weeks.of(-1));
        assertThatIllegalArgumentException().isThrownBy(() -> Weeks.of(9).minus(Weeks.of(10)));
    }

    @Test
    void addsSubtractsAndScales() {
        // parental leave 41 weeks: 9 non-transferable weeks for the father, the rest
        // for the mother
        assertThat(Weeks.of(41).minus(Weeks.of(9))).isEqualTo(Weeks.of(32));
        assertThat(Weeks.of(20).plus(Weeks.of(32))).isEqualTo(Weeks.of(52));
        // 8 weeks combined with half-time work extend the leave by 4 weeks
        assertThat(Weeks.of(8).times(Rate.of("0.5"))).isEqualTo(Weeks.of(4));
    }

    @Test
    void comparesWeeks() {
        assertThat(Weeks.of(9).min(Weeks.of(14))).isEqualTo(Weeks.of(9));
        assertThat(Weeks.of(9).max(Weeks.of(14))).isEqualTo(Weeks.of(14));
        assertThat(Weeks.of("2.0")).isEqualTo(Weeks.of(2));
        assertThat(Weeks.ZERO.isZero()).isTrue();
    }
}
