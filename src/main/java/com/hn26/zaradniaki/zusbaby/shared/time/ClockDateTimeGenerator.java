package com.hn26.zaradniaki.zusbaby.shared.time;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;

/** {@link DateTimeGenerator} backed by a {@link Clock}. */
public class ClockDateTimeGenerator implements DateTimeGenerator {

    private final Clock clock;

    public ClockDateTimeGenerator(Clock clock) {
        this.clock = clock;
    }

    @Override
    public Instant now() {
        return clock.instant();
    }

    @Override
    public LocalDate today() {
        return LocalDate.now(clock);
    }

    @Override
    public ZoneId zone() {
        return clock.getZone();
    }
}
