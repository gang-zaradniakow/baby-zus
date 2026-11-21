package com.hn26.zaradniaki.zusbaby.shared.time;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;

/**
 * Test double for {@link DateTimeGenerator}: time stands still until a test
 * moves it. Defaults to noon in the legal zone, so moving by whole days never
 * crosses a date boundary because of DST.
 */
public final class FixedDateTimeGenerator implements DateTimeGenerator {

    private final ZoneId zone;
    private Instant now;

    private FixedDateTimeGenerator(Instant now, ZoneId zone) {
        this.now = now;
        this.zone = zone;
    }

    public static FixedDateTimeGenerator at(Instant now) {
        return new FixedDateTimeGenerator(now, ClockConfiguration.LEGAL_ZONE);
    }

    public static FixedDateTimeGenerator onDay(LocalDate day) {
        return at(day.atTime(LocalTime.NOON).atZone(ClockConfiguration.LEGAL_ZONE).toInstant());
    }

    public static FixedDateTimeGenerator onDay(String isoDay) {
        return onDay(LocalDate.parse(isoDay));
    }

    public void setDay(LocalDate day) {
        this.now = day.atTime(LocalTime.NOON).atZone(zone).toInstant();
    }

    public void advance(Duration duration) {
        this.now = now.plus(duration);
    }

    public void advanceDays(long days) {
        setDay(today().plusDays(days));
    }

    @Override
    public Instant now() {
        return now;
    }

    @Override
    public LocalDate today() {
        return LocalDate.ofInstant(now, zone);
    }

    @Override
    public ZoneId zone() {
        return zone;
    }
}
