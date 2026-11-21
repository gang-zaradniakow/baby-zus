package com.hn26.zaradniaki.zusbaby.golden;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatIllegalStateException;

import java.time.LocalDate;
import org.junit.jupiter.api.Test;

class GoldenCasesTest {

    record HolidaysInput(int year) {
    }

    record Holiday(LocalDate date, String name) {
    }

    record HolidaysExpected(java.util.List<Holiday> holidays) {
    }

    @Test
    void loadsTypedCasesWithNames() {
        var cases = GoldenCases.load("holidays", HolidaysInput.class, HolidaysExpected.class).toList();

        assertThat(cases).isNotEmpty();
        assertThat(cases.getFirst().name()).isEqualTo("holidays 2024").isEqualTo(cases.getFirst().toString());
        assertThat(cases.getFirst().input().year()).isEqualTo(2024);
        assertThat(cases.getFirst().expected().holidays().getFirst())
                .isEqualTo(new Holiday(LocalDate.of(2024, 1, 1), "Nowy Rok"));
    }

    @Test
    void explainsHowToGenerateMissingFile() {
        assertThatIllegalStateException()
                .isThrownBy(() -> GoldenCases.load("no-such-area", HolidaysInput.class, HolidaysExpected.class))
                .withMessageContaining("tools/golden/generate.mjs");
    }
}
