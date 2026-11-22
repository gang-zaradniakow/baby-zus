package com.hn26.zaradniaki.zusbaby.shared.time;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;

/**
 * Source of the current date and time for the whole application. Code never
 * calls {@code LocalDate.now()} or {@code Instant.now()} directly, so tests can
 * freeze or move time with a fixed implementation.
 */
public interface DateTimeGenerator {

    /** Current moment, e.g. for audit timestamps. */
    Instant now();

    /** Current calendar day in the legal time zone, used for deadlines and ages. */
    LocalDate today();

    /** Time zone in which legal dates are counted. */
    ZoneId zone();
}
