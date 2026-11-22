package com.hn26.zaradniaki.zusbaby.benefits.domain.leave;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatIllegalArgumentException;

import com.hn26.zaradniaki.zusbaby.benefits.domain.LeaveParametersFixtures;
import com.hn26.zaradniaki.zusbaby.shared.domain.Weeks;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

class LeaveDimensionsPolicyTest {

    private final LeaveDimensionsPolicy policy = new LeaveDimensionsPolicy();

    @ParameterizedTest
    @CsvSource({"1, 20", "2, 31", "3, 33", "4, 35", "5, 37", "7, 37"})
    void maternityLeaveDependsOnNumberOfChildren(int children, int weeks) {
        assertThat(policy.maternityWeeks(children, LeaveParametersFixtures.legalState2026())).isEqualTo(Weeks.of(weeks));
    }

    @ParameterizedTest
    @CsvSource({"1, false, 41", "2, false, 43", "1, true, 65", "3, true, 67"})
    void parentalLeaveDependsOnChildrenAndZaZyciem(int children, boolean zaZyciem, int weeks) {
        assertThat(policy.parentalWeeks(children, zaZyciem, LeaveParametersFixtures.legalState2026()))
                .isEqualTo(Weeks.of(weeks));
    }

    @Test
    void requiresAtLeastOneChild() {
        assertThatIllegalArgumentException()
                .isThrownBy(() -> policy.maternityWeeks(0, LeaveParametersFixtures.legalState2026()));
    }
}
