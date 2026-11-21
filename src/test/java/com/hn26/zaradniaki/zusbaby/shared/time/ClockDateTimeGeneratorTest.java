package com.hn26.zaradniaki.zusbaby.shared.time;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import org.junit.jupiter.api.Test;

class ClockDateTimeGeneratorTest {

    private static final ZoneId WARSAW = ZoneId.of("Europe/Warsaw");

    @Test
    void returnsInstantOfTheClock() {
        Instant instant = Instant.parse("2026-11-21T10:15:30Z");
        var generator = new ClockDateTimeGenerator(Clock.fixed(instant, WARSAW));

        assertThat(generator.now()).isEqualTo(instant);
    }

    @Test
    void countsTodayInClockZoneNotInUtc() {
        // 23:30 UTC on 31 Dec is already 1 Jan in Warsaw
        var generator = new ClockDateTimeGenerator(Clock.fixed(Instant.parse("2026-12-31T23:30:00Z"), WARSAW));

        assertThat(generator.today()).isEqualTo(LocalDate.of(2027, 1, 1));
    }

    @Test
    void exposesClockZone() {
        var generator = new ClockDateTimeGenerator(Clock.fixed(Instant.EPOCH, WARSAW));

        assertThat(generator.zone()).isEqualTo(WARSAW);
    }
}
