package com.hn26.zaradniaki.zusbaby.benefits.domain.leave;

import static org.assertj.core.api.Assertions.assertThat;

import com.hn26.zaradniaki.zusbaby.benefits.api.model.AdoptionType;
import com.hn26.zaradniaki.zusbaby.benefits.api.model.TakenInChild;
import com.hn26.zaradniaki.zusbaby.benefits.domain.LeaveParametersFixtures;
import com.hn26.zaradniaki.zusbaby.golden.GoldenCase;
import com.hn26.zaradniaki.zusbaby.golden.GoldenCases;
import com.hn26.zaradniaki.zusbaby.shared.domain.Weeks;
import java.math.BigDecimal;
import java.util.stream.Stream;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;

class AdoptionLeavePolicyTest {

    record Input(int children, boolean zaZyciem, AdoptionType type, BigDecimal childAge, boolean deferredSchool) {
    }

    record Expected(int maternityWeeks, int parentalWeeks, int ageLimit, String note) {
    }

    private final AdoptionLeavePolicy policy = new AdoptionLeavePolicy(new LeaveDimensionsPolicy());

    /**
     * Expected results of {@code adoptWeeks()} in the frontend prototype
     * (golden/adoptionLeave.json).
     */
    static Stream<GoldenCase<Input, Expected>> mockupCases() {
        return GoldenCases.load("adoptionLeave", Input.class, Expected.class);
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("mockupCases")
    void calculatesLeaveLikeTheMockup(GoldenCase<Input, Expected> golden) {
        Input input = golden.input();

        AdoptionLeave leave = policy.leave(input.children(), input.zaZyciem(),
                new TakenInChild(input.type(), input.childAge(), input.deferredSchool()),
                LeaveParametersFixtures.legalState2026());

        Expected expected = golden.expected();
        assertThat(leave).isEqualTo(new AdoptionLeave(Weeks.of(expected.maternityWeeks()),
                Weeks.of(expected.parentalWeeks()), expected.ageLimit(), expected.note()));
    }
}
