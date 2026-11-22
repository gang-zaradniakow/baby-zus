package com.hn26.zaradniaki.zusbaby.benefits.domain;

import static org.assertj.core.api.Assertions.assertThat;

import com.hn26.zaradniaki.zusbaby.shared.domain.Money;
import com.hn26.zaradniaki.zusbaby.shared.domain.Rate;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

class IncomeTaxAdvanceTest {

    /**
     * Values of {@code netto()} in the frontend prototype: the 12% advance is
     * rounded to whole zloty.
     */
    @ParameterizedTest
    @CsvSource({"5177.4, 4556.4", "4877.11, 4292.11", "1000, 880", "0, 0", "4.16, 4.16", "4.17, 3.17"})
    void deductsTheAdvanceRoundedToWholeZloty(String gross, String net) {
        assertThat(IncomeTaxAdvance.net(Money.of(gross), Rate.of("0.12"))).isEqualTo(Money.of(net));
    }
}
