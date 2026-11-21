package com.hn26.zaradniaki.zusbaby.shared.domain;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

/**
 * Expected strings produced by {@code fmtMoney()} of the frontend prototype
 * (pl-PL).
 */
class PolishFormatTest {

    private static final String NBSP = " ";

    @ParameterizedTest
    @CsvSource(delimiter = ';', value = {"4147.1; 4147,10 zł", "48.06; 48,06 zł", "1000; 1000,00 zł",
            "0.005; 0,01 zł", "4877.1108; 4877,11 zł", "-62.4; -62,40 zł"})
    void formatsAmountsBelowTenThousandWithoutGrouping(String amount, String expected) {
        assertThat(PolishFormat.money(Money.of(amount))).isEqualTo(expected);
    }

    @Test
    void groupsThousandsWithNonBreakingSpaceFromFiveDigits() {
        assertThat(PolishFormat.money(Money.of("20321.3"))).isEqualTo("20" + NBSP + "321,30 zł");
        assertThat(PolishFormat.money(Money.of("123456.789"))).isEqualTo("123" + NBSP + "456,79 zł");
        assertThat(PolishFormat.money(Money.of("1234567.5"))).isEqualTo("1" + NBSP + "234" + NBSP + "567,50 zł");
    }

    @Test
    void roundsToGroszeFirstThenToWholeZloty() {
        assertThat(PolishFormat.money(Money.of("2.495"), 0)).isEqualTo("3 zł");
        assertThat(PolishFormat.money(Money.of("123456.789"), 0)).isEqualTo("123" + NBSP + "457 zł");
    }

    @Test
    void formatsPercentWithTwoDecimals() {
        assertThat(PolishFormat.percent(Rate.of("0.1371"))).isEqualTo("13,71");
        assertThat(PolishFormat.percent(Rate.of("0.815"))).isEqualTo("81,50");
    }
}
