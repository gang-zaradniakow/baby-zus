package com.hn26.zaradniaki.zusbaby.shared.time;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;

class FixedDateTimeGeneratorTest {

    @Test
    void staysOnGivenDay() {
        var generator = FixedDateTimeGenerator.onDay("2026-11-21");

        assertThat(generator.today()).isEqualTo(LocalDate.of(2026, 11, 21));
        assertThat(generator.now()).isEqualTo(generator.now());
    }

    @Test
    void advancesByDaysAcrossDstChange() {
        // DST ends in Poland on 25 Oct 2026
        var generator = FixedDateTimeGenerator.onDay("2026-10-24");

        generator.advanceDays(2);

        assertThat(generator.today()).isEqualTo(LocalDate.of(2026, 10, 26));
    }

    @Test
    void advancesByDuration() {
        var generator = FixedDateTimeGenerator.onDay("2026-11-21");
        var before = generator.now();

        generator.advance(Duration.ofHours(13));

        assertThat(generator.now()).isEqualTo(before.plus(Duration.ofHours(13)));
        assertThat(generator.today()).isEqualTo(LocalDate.of(2026, 11, 22));
    }

    @Test
    void canJumpToAnotherDay() {
        var generator = FixedDateTimeGenerator.onDay("2026-11-21");

        generator.setDay(LocalDate.of(2027, 2, 1));

        assertThat(generator.today()).isEqualTo(LocalDate.of(2027, 2, 1));
    }
}
