package com.hn26.zaradniaki.zusbaby.benefits.domain.maternity;

import static com.hn26.zaradniaki.zusbaby.benefits.GoldenMoney.assertMoney;
import static org.assertj.core.api.Assertions.assertThat;

import com.hn26.zaradniaki.zusbaby.benefits.api.model.PretermBirth;
import com.hn26.zaradniaki.zusbaby.benefits.api.model.TakenInChild;
import com.hn26.zaradniaki.zusbaby.benefits.domain.BenefitParametersFixtures;
import com.hn26.zaradniaki.zusbaby.benefits.domain.LeaveParametersFixtures;
import com.hn26.zaradniaki.zusbaby.benefits.domain.MaternityParametersFixtures;
import com.hn26.zaradniaki.zusbaby.benefits.domain.insurance.InsuranceTitleResolver;
import com.hn26.zaradniaki.zusbaby.benefits.domain.insurance.InsuranceTitlesInput;
import com.hn26.zaradniaki.zusbaby.benefits.domain.insurance.ResolvedInsurance;
import com.hn26.zaradniaki.zusbaby.benefits.domain.leave.AdoptionLeavePolicy;
import com.hn26.zaradniaki.zusbaby.benefits.domain.leave.LeaveDimensionsPolicy;
import com.hn26.zaradniaki.zusbaby.benefits.domain.leave.SupplementaryLeavePolicy;
import com.hn26.zaradniaki.zusbaby.golden.GoldenCase;
import com.hn26.zaradniaki.zusbaby.golden.GoldenCases;
import com.hn26.zaradniaki.zusbaby.shared.domain.Check;
import com.hn26.zaradniaki.zusbaby.shared.domain.DateRange;
import com.hn26.zaradniaki.zusbaby.shared.domain.Money;
import com.hn26.zaradniaki.zusbaby.shared.domain.Rate;
import com.hn26.zaradniaki.zusbaby.shared.domain.Weeks;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Stream;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;

class MaternityBenefitCalculatorTest {

    record FatherInput(InsuranceTitlesInput titles, boolean paternityLeave, int parentalWeeks,
            int maternityWeeksTaken) {
    }

    record WorkInput(Parent parent, BigDecimal share, int weeks) {
    }

    record Input(CareSituation situation, LocalDate startDate, int children, boolean zaZyciem, PretermBirth preterm,
            TakenInChild adoption, BenefitVariant variant, InsuranceTitlesInput mother, FatherInput father,
            WorkInput work) {
    }

    record ExpectedSegment(Parent parent, String label, BigDecimal weeks, BigDecimal rate, BigDecimal workFactor,
            LocalDate from, LocalDate to, BigDecimal monthlyGross, BigDecimal monthlyNet, BigDecimal total) {
    }

    record ExpectedTotals(BigDecimal mother, BigDecimal father, BigDecimal family) {
    }

    record ExpectedAlternative(AlternativeBenefitKind kind, String title, String payer, BigDecimal monthly,
            int weeks) {
    }

    record Expected(List<ExpectedSegment> segments, ExpectedTotals totals, List<Check> checks, List<String> notes,
            ExpectedAlternative alternative) {
    }

    private final InsuranceTitleResolver resolver = new InsuranceTitleResolver();
    private final LeaveDimensionsPolicy dimensions = new LeaveDimensionsPolicy();
    private final MaternityBenefitCalculator calculator = new MaternityBenefitCalculator(
            new MaternityBenefitSimulator(dimensions, new AdoptionLeavePolicy(dimensions),
                    new SupplementaryLeavePolicy()),
            new AlternativeBenefitPolicy());

    /**
     * The calculator screen of the prototype ({@code simOut()} in js/app.js), from
     * both parents' insurance titles (golden/maternityBenefit.json).
     */
    static Stream<GoldenCase<Input, Expected>> mockupCases() {
        return GoldenCases.load("maternityBenefit", Input.class, Expected.class);
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("mockupCases")
    void calculatesLikeTheMockup(GoldenCase<Input, Expected> golden) {
        MaternityBenefit result = calculator.calculate(toCase(golden.input()),
                MaternityParametersFixtures.legalState2026(), LeaveParametersFixtures.legalState2026());

        Expected expected = golden.expected();
        List<LeaveSegment> segments = result.simulation().segments();
        assertThat(segments).hasSameSizeAs(expected.segments());
        for (int i = 0; i < segments.size(); i++) {
            LeaveSegment actual = segments.get(i);
            ExpectedSegment segment = expected.segments().get(i);
            assertThat(actual.parent()).isEqualTo(segment.parent());
            assertThat(actual.label()).isEqualTo(segment.label());
            assertThat(actual.weeks()).isEqualTo(new Weeks(segment.weeks()));
            assertThat(actual.rate()).isEqualTo(new Rate(segment.rate()));
            assertThat(actual.workFactor()).isEqualTo(new Rate(segment.workFactor()));
            assertThat(actual.period()).isEqualTo(new DateRange(segment.from(), segment.to()));
            assertMoney(actual.monthlyGross(), segment.monthlyGross(), "monthlyGross of segment " + i);
            assertMoney(actual.monthlyNet(), segment.monthlyNet(), "monthlyNet of segment " + i);
            assertMoney(actual.total(), segment.total(), "total of segment " + i);
        }
        MaternityTotals totals = result.simulation().totals();
        assertMoney(totals.mother(), expected.totals().mother(), "mother total");
        assertMoney(totals.father(), expected.totals().father(), "father total");
        assertMoney(totals.family(), expected.totals().family(), "family total");
        assertThat(result.checks()).isEqualTo(expected.checks());
        assertThat(result.simulation().notes()).isEqualTo(expected.notes());
        ExpectedAlternative alternative = expected.alternative();
        assertThat(result.alternative()).isEqualTo(alternative == null
                ? null
                : new AlternativeBenefit(alternative.kind(), alternative.title(), alternative.payer(),
                        new Money(alternative.monthly()), Weeks.of(alternative.weeks())));
    }

    private MaternityCase toCase(Input input) {
        FatherInput father = input.father();
        WorkInput work = input.work();
        return new MaternityCase(input.situation(), input.startDate(), input.children(), input.zaZyciem(),
                input.variant(), input.preterm(), input.adoption(), resolve(input.mother()), resolve(father.titles()),
                new FatherLeaveChoices(father.paternityLeave(), father.parentalWeeks(), father.maternityWeeksTaken()),
                work == null ? null : new PartTimeWork(work.parent(), new Rate(work.share()), work.weeks()));
    }

    private ResolvedInsurance resolve(
            InsuranceTitlesInput titles) {
        return resolver.resolve(titles.toTitles(), BenefitParametersFixtures.legalState2026());
    }
}
