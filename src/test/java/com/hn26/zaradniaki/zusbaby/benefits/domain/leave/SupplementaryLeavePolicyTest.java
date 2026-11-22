package com.hn26.zaradniaki.zusbaby.benefits.domain.leave;

import static org.assertj.core.api.Assertions.assertThat;

import com.hn26.zaradniaki.zusbaby.benefits.domain.LeaveParametersFixtures;
import com.hn26.zaradniaki.zusbaby.golden.GoldenCase;
import com.hn26.zaradniaki.zusbaby.golden.GoldenCases;
import com.hn26.zaradniaki.zusbaby.shared.domain.Weeks;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;

class SupplementaryLeavePolicyTest {

    record Expected(int weeks, int limit, String rule) {
    }

    private final SupplementaryLeavePolicy policy = new SupplementaryLeavePolicy();

    /**
     * Expected results of {@code uzupelniajacy()} in the frontend prototype
     * (golden/supplementaryLeave.json).
     */
    static Stream<GoldenCase<PretermBirth, Expected>> mockupCases() {
        return GoldenCases.load("supplementaryLeave", PretermBirth.class, Expected.class);
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("mockupCases")
    void calculatesLeaveLikeTheMockup(GoldenCase<PretermBirth, Expected> golden) {
        SupplementaryLeave leave = policy.leave(golden.input(), LeaveParametersFixtures.legalState2026());

        Expected expected = golden.expected();
        assertThat(leave).isEqualTo(
                new SupplementaryLeave(Weeks.of(expected.weeks()), Weeks.of(expected.limit()), expected.rule()));
    }

    @Test
    void everyStartedWeekInHospitalCounts() {
        var eightDays = policy.leave(new PretermBirth(30, 1500, 8, 5), LeaveParametersFixtures.legalState2026());

        assertThat(eightDays.weeks()).isEqualTo(Weeks.of(2));
    }
}
