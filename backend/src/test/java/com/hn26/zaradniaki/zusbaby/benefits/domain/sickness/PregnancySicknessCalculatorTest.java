package com.hn26.zaradniaki.zusbaby.benefits.domain.sickness;

import static com.hn26.zaradniaki.zusbaby.benefits.GoldenMoney.assertMoney;
import static org.assertj.core.api.Assertions.assertThat;

import com.hn26.zaradniaki.zusbaby.benefits.domain.BenefitParametersFixtures;
import com.hn26.zaradniaki.zusbaby.benefits.domain.SicknessParametersFixtures;
import com.hn26.zaradniaki.zusbaby.benefits.domain.insurance.InsuranceTitleResolver;
import com.hn26.zaradniaki.zusbaby.benefits.domain.insurance.InsuranceTitles;
import com.hn26.zaradniaki.zusbaby.benefits.domain.insurance.InsuranceTitlesInput;
import com.hn26.zaradniaki.zusbaby.golden.GoldenCase;
import com.hn26.zaradniaki.zusbaby.golden.GoldenCases;
import com.hn26.zaradniaki.zusbaby.shared.domain.Check;
import com.hn26.zaradniaki.zusbaby.shared.domain.Money;
import com.hn26.zaradniaki.zusbaby.shared.domain.Rate;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.IntStream;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;

class PregnancySicknessCalculatorTest {

    record Input(InsuranceTitlesInput titles, SickLeave leave) {
    }

    record ExpectedPart(String label, int days, BigDecimal rate, BigDecimal amount) {
    }

    record Expected(List<Check> checks, List<ExpectedPart> parts, BigDecimal total, BigDecimal netTotal) {
    }

    /**
     * Intentional deviations from the prototype, by golden case name: the prototype
     * says "no sickness insurance" when the only title is blocked by debt; the
     * backend explains the debt.
     */
    private static final Map<String, List<Check>> DEVIATIONS = Map.of("own firm with blocking debt",
            List.of(Check.no("Zaległość w składkach 62,40 zł — zasiłek wstrzymany do spłaty.")));

    private final InsuranceTitleResolver resolver = new InsuranceTitleResolver();
    private final PregnancySicknessCalculator calculator = new PregnancySicknessCalculator();

    /**
     * Expected results of {@code chorobowyMulti(resolvePerson(...))} in the
     * prototype (golden/pregnancySickness.json).
     */
    static Stream<GoldenCase<Input, Expected>> mockupCases() {
        return GoldenCases.load("pregnancySickness", Input.class, Expected.class);
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("mockupCases")
    void calculatesPayLikeTheMockup(GoldenCase<Input, Expected> golden) {
        var insurance = resolver.resolve(golden.input().titles().toTitles(),
                BenefitParametersFixtures.legalState2026());

        PregnancySickness result = calculator.calculate(insurance, golden.input().leave(),
                SicknessParametersFixtures.legalState2026());

        Expected expected = golden.expected();
        assertThat(result.checks()).isEqualTo(DEVIATIONS.getOrDefault(golden.name(), expected.checks()));
        assertThat(result.parts()).extracting(SicknessPayPart::label, SicknessPayPart::days)
                .containsExactlyElementsOf(expected.parts().stream()
                        .map(part -> org.assertj.core.groups.Tuple.tuple(part.label(), part.days())).toList());
        IntStream.range(0, expected.parts().size()).forEach(i -> {
            assertThat(result.parts().get(i).rate()).isEqualTo(new Rate(expected.parts().get(i).rate()));
            assertMoney(result.parts().get(i).amount(), expected.parts().get(i).amount(), "part " + i);
        });
        assertMoney(result.total(), expected.total(), "total");
        assertMoney(result.netTotal(), expected.netTotal(), "net total");
    }

    @Test
    void explainsDebtThatBlocksTheOnlyTitle() {
        var titles = new InsuranceTitles(null, null,
                new InsuranceTitles.SelfEmployment(Money.of("4877.11"), true, false, Money.of("62.40")), false);

        var result = calculator.calculate(resolver.resolve(titles, BenefitParametersFixtures.legalState2026()),
                new SickLeave(30, 0, false, 365), SicknessParametersFixtures.legalState2026());

        assertThat(result.checks()).containsExactly(
                Check.no("Zaległość w składkach 62,40 zł — zasiłek wstrzymany do spłaty."));
        assertThat(result.total()).isEqualTo(Money.ZERO);
    }
}
