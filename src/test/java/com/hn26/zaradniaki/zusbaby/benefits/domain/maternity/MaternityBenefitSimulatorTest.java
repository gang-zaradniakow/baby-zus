package com.hn26.zaradniaki.zusbaby.benefits.domain.maternity;

import static org.assertj.core.api.Assertions.assertThat;

import com.hn26.zaradniaki.zusbaby.benefits.api.model.PretermBirth;
import com.hn26.zaradniaki.zusbaby.benefits.api.model.TakenInChild;
import com.hn26.zaradniaki.zusbaby.benefits.domain.LeaveParametersFixtures;
import com.hn26.zaradniaki.zusbaby.benefits.domain.MaternityParametersFixtures;
import com.hn26.zaradniaki.zusbaby.benefits.domain.insurance.InsuranceTitle;
import com.hn26.zaradniaki.zusbaby.benefits.domain.insurance.ResolvedInsurance;
import com.hn26.zaradniaki.zusbaby.benefits.domain.leave.AdoptionLeavePolicy;
import com.hn26.zaradniaki.zusbaby.benefits.domain.leave.LeaveDimensionsPolicy;
import com.hn26.zaradniaki.zusbaby.benefits.domain.leave.SupplementaryLeavePolicy;
import com.hn26.zaradniaki.zusbaby.golden.GoldenCase;
import com.hn26.zaradniaki.zusbaby.golden.GoldenCases;
import com.hn26.zaradniaki.zusbaby.shared.domain.Check;
import com.hn26.zaradniaki.zusbaby.shared.domain.Money;
import com.hn26.zaradniaki.zusbaby.shared.domain.Rate;
import com.hn26.zaradniaki.zusbaby.shared.domain.Weeks;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Stream;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;

class MaternityBenefitSimulatorTest {

    /**
     * Resolved insurance of a parent, as returned by resolvePerson() in the
     * prototype.
     */
    record ParentInput(String mainTitle, BigDecimal base, BigDecimal blockingDebt, boolean agriculturalInsurance) {

        ResolvedInsurance toInsurance() {
            return new ResolvedInsurance("NONE".equals(mainTitle) ? null : InsuranceTitle.valueOf(mainTitle),
                    new Money(base), List.of(), List.of(), agriculturalInsurance, new Money(blockingDebt));
        }
    }

    record FatherInput(ParentInput insurance, boolean paternityLeave, int parentalWeeks, int maternityWeeksTaken) {
    }

    record Input(CareSituation situation, LocalDate startDate, int children, boolean zaZyciem, PretermBirth preterm,
            TakenInChild adoption, BenefitVariant variant, ParentInput mother, FatherInput father) {

        MaternityCase toCase() {
            return new MaternityCase(situation, startDate, children, zaZyciem, variant, preterm, adoption,
                    mother.toInsurance(), father.insurance().toInsurance(), new FatherLeaveChoices(
                            father.paternityLeave(), father.parentalWeeks(), father.maternityWeeksTaken()),
                    null);
        }
    }

    record ExpectedSegment(Parent parent, String label, BigDecimal weeks, BigDecimal rate, BigDecimal workFactor,
            LocalDate from, LocalDate to) {
    }

    record Expected(int maternityWeeks, int parentalWeeks, int supplementaryWeeks, int motherMaternityWeeks,
            int fatherMaternityWeeks, int motherParentalWeeks, int fatherParentalWeeks, boolean averagedVariant,
            List<ExpectedSegment> segments, List<Check> checks, List<String> notes) {
    }

    private final LeaveDimensionsPolicy dimensions = new LeaveDimensionsPolicy();
    private final MaternityBenefitSimulator simulator = new MaternityBenefitSimulator(dimensions,
            new AdoptionLeavePolicy(dimensions), new SupplementaryLeavePolicy());

    /**
     * Leave split and timeline of {@code simulate()} in the prototype
     * (golden/maternitySegments.json).
     */
    static Stream<GoldenCase<Input, Expected>> mockupCases() {
        return GoldenCases.load("maternitySegments", Input.class, Expected.class);
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("mockupCases")
    void splitsLeaveLikeTheMockup(GoldenCase<Input, Expected> golden) {
        MaternitySimulation result = simulator.simulate(golden.input().toCase(),
                MaternityParametersFixtures.legalState2026(), LeaveParametersFixtures.legalState2026());

        Expected expected = golden.expected();
        assertThat(result.maternityWeeks()).isEqualTo(Weeks.of(expected.maternityWeeks()));
        assertThat(result.parentalWeeks()).isEqualTo(Weeks.of(expected.parentalWeeks()));
        assertThat(result.supplementaryWeeks()).isEqualTo(Weeks.of(expected.supplementaryWeeks()));
        assertThat(result.mother()).isEqualTo(new ParentLeaveShare(Weeks.of(expected.motherMaternityWeeks()),
                Weeks.of(expected.motherParentalWeeks())));
        assertThat(result.father()).isEqualTo(new ParentLeaveShare(Weeks.of(expected.fatherMaternityWeeks()),
                Weeks.of(expected.fatherParentalWeeks())));
        assertThat(result.averagedVariant()).isEqualTo(expected.averagedVariant());
        // amounts are compared in MaternityBenefitCalculatorTest
        assertThat(result.segments())
                .extracting(segment -> new ExpectedSegment(segment.parent(), segment.label(),
                        segment.weeks().value(), segment.rate().value(), segment.workFactor().value(),
                        segment.period().from(), segment.period().to()))
                .isEqualTo(expected.segments().stream()
                        .map(segment -> new ExpectedSegment(segment.parent(), segment.label(),
                                new Weeks(segment.weeks()).value(), new Rate(segment.rate()).value(),
                                new Rate(segment.workFactor()).value(), segment.from(), segment.to()))
                        .toList());
        assertThat(result.checks()).isEqualTo(expected.checks());
        assertThat(result.notes()).isEqualTo(expected.notes());
    }
}
