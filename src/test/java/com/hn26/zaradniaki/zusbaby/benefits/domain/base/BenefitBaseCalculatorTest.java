package com.hn26.zaradniaki.zusbaby.benefits.domain.base;

import static com.hn26.zaradniaki.zusbaby.benefits.GoldenMoney.assertMoney;
import static org.assertj.core.api.Assertions.assertThat;

import com.hn26.zaradniaki.zusbaby.benefits.domain.BenefitParametersFixtures;
import com.hn26.zaradniaki.zusbaby.benefits.domain.insurance.InsuranceTitle;
import com.hn26.zaradniaki.zusbaby.golden.GoldenCase;
import com.hn26.zaradniaki.zusbaby.golden.GoldenCases;
import com.hn26.zaradniaki.zusbaby.shared.domain.Money;
import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Stream;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;

class BenefitBaseCalculatorTest {

    record MonthInput(BigDecimal amount, boolean skip) {
    }

    record Input(List<MonthInput> months, InsuranceTitle title, boolean fullTime) {
    }

    record Expected(BigDecimal base, BigDecimal average, int monthsCounted, String note) {
    }

    private final BenefitBaseCalculator calculator = new BenefitBaseCalculator();

    /**
     * Expected results of {@code podstawaZ3()} in the frontend prototype
     * (golden/benefitBase.json).
     */
    static Stream<GoldenCase<Input, Expected>> mockupCases() {
        return GoldenCases.load("benefitBase", Input.class, Expected.class);
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("mockupCases")
    void calculatesBaseLikeTheMockup(GoldenCase<Input, Expected> golden) {
        Input input = golden.input();
        List<MonthlyPay> months = input.months().stream()
                .map(month -> new MonthlyPay(new Money(month.amount()), month.skip())).toList();

        BenefitBase base = calculator.fromMonthlyPay(months, input.title(), input.fullTime(),
                BenefitParametersFixtures.legalState2026());

        assertMoney(base.base(), golden.expected().base(), "base");
        assertMoney(base.average(), golden.expected().average(), "average");
        assertThat(base.monthsCounted()).isEqualTo(golden.expected().monthsCounted());
        assertThat(base.note()).isEqualTo(golden.expected().note());
    }
}
