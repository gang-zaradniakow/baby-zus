package com.hn26.zaradniaki.zusbaby.benefits.domain.insurance;

import static com.hn26.zaradniaki.zusbaby.benefits.GoldenMoney.assertMoney;
import static org.assertj.core.api.Assertions.assertThat;

import com.hn26.zaradniaki.zusbaby.benefits.domain.BenefitParametersFixtures;
import com.hn26.zaradniaki.zusbaby.golden.GoldenCase;
import com.hn26.zaradniaki.zusbaby.golden.GoldenCases;
import com.hn26.zaradniaki.zusbaby.shared.domain.Check;
import com.hn26.zaradniaki.zusbaby.shared.domain.Money;
import java.math.BigDecimal;
import java.util.List;
import java.util.stream.IntStream;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;

class InsuranceTitleResolverTest {

    record EmploymentInput(BigDecimal base, boolean atLeastMinimumWage) {
    }

    record MandateInput(BigDecimal base, boolean voluntarySickness, boolean student) {
    }

    record FirmInput(BigDecimal base, boolean voluntarySickness, boolean startupRelief, BigDecimal debt) {
    }

    record Input(EmploymentInput employment, MandateInput mandateContract, FirmInput selfEmployment,
            boolean agriculturalInsurance) {

        InsuranceTitles toTitles() {
            return new InsuranceTitles(
                    employment == null
                            ? null
                            : new InsuranceTitles.Employment(new Money(employment.base()),
                                    employment.atLeastMinimumWage()),
                    mandateContract == null
                            ? null
                            : new InsuranceTitles.MandateContract(new Money(mandateContract.base()),
                                    mandateContract.voluntarySickness(), mandateContract.student()),
                    selfEmployment == null
                            ? null
                            : new InsuranceTitles.SelfEmployment(new Money(selfEmployment.base()),
                                    selfEmployment.voluntarySickness(), selfEmployment.startupRelief(),
                                    new Money(selfEmployment.debt())),
                    agriculturalInsurance);
        }
    }

    record ExpectedPart(String title, BigDecimal base) {
    }

    record Expected(String mainTitle, BigDecimal base, List<ExpectedPart> parts, List<Check> checks,
            boolean agriculturalInsurance, BigDecimal blockingDebt) {
    }

    private final InsuranceTitleResolver resolver = new InsuranceTitleResolver();

    /**
     * Expected results of {@code resolvePerson()} in the frontend prototype
     * (golden/insuranceTitles.json).
     */
    static Stream<GoldenCase<Input, Expected>> mockupCases() {
        return GoldenCases.load("insuranceTitles", Input.class, Expected.class);
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("mockupCases")
    void resolvesTitlesLikeTheMockup(GoldenCase<Input, Expected> golden) {
        Expected expected = golden.expected();

        ResolvedInsurance resolved = resolver.resolve(golden.input().toTitles(),
                BenefitParametersFixtures.legalState2026());

        assertThat(resolved.mainTitle() == null ? "NONE" : resolved.mainTitle().name())
                .isEqualTo(expected.mainTitle());
        assertMoney(resolved.base(), expected.base(), "base");
        assertThat(resolved.parts()).extracting(part -> part.title().name())
                .containsExactlyElementsOf(expected.parts().stream().map(ExpectedPart::title).toList());
        IntStream.range(0, expected.parts().size()).forEach(i -> assertMoney(resolved.parts().get(i).base(),
                expected.parts().get(i).base(), "part " + i));
        assertThat(resolved.checks()).isEqualTo(expected.checks());
        assertThat(resolved.agriculturalInsurance()).isEqualTo(expected.agriculturalInsurance());
        assertMoney(resolved.blockingDebt(), expected.blockingDebt(), "blocking debt");
    }

    @Test
    void mandateContractExactlyAtMinimumWageIsTheMandatoryTitle() {
        // 4806 PLN gross minus 13.71% = 4147.0974 PLN
        var titles = new InsuranceTitles(null, new InsuranceTitles.MandateContract(Money.of("4147.0974"), true, false),
                new InsuranceTitles.SelfEmployment(Money.of("4877.11"), true, false, Money.ZERO), false);

        var resolved = resolver.resolve(titles, BenefitParametersFixtures.legalState2026());

        assertThat(resolved.mainTitle()).isEqualTo(InsuranceTitle.MANDATE_CONTRACT);
        assertThat(resolved.parts()).extracting(TitleBase::title).containsExactly(InsuranceTitle.MANDATE_CONTRACT);
    }

    @Test
    void debtExactlyAtTheThresholdDoesNotBlock() {
        var titles = new InsuranceTitles(null, null,
                new InsuranceTitles.SelfEmployment(Money.of("4877.11"), true, false, Money.of("48.06")), false);

        var resolved = resolver.resolve(titles, BenefitParametersFixtures.legalState2026());

        assertThat(resolved.parts()).hasSize(1);
        assertThat(resolved.blockingDebt()).isEqualTo(Money.ZERO);
    }
}
