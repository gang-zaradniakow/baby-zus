package com.hn26.zaradniaki.zusbaby.shared.domain;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Objects;

/**
 * Closed range of calendar days: both {@code from} and {@code to} are included,
 * as in leave periods.
 */
public record DateRange(LocalDate from, LocalDate to) {

    public DateRange {
        Objects.requireNonNull(from, "from");
        Objects.requireNonNull(to, "to");
        if (to.isBefore(from)) {
            throw new IllegalArgumentException("Range end " + to + " is before its start " + from);
        }
    }

    /**
     * Range of {@code days} days starting on {@code start}, e.g. 14 days of
     * paternity leave.
     */
    public static DateRange startingAt(LocalDate start, long days) {
        if (days < 1) {
            throw new IllegalArgumentException("Range must have at least one day, was " + days);
        }
        return new DateRange(start, start.plusDays(days - 1));
    }

    public static DateRange startingAt(LocalDate start, Weeks weeks) {
        return startingAt(start, weeks.toDays());
    }

    public long lengthInDays() {
        return ChronoUnit.DAYS.between(from, to) + 1;
    }

    public boolean contains(LocalDate day) {
        return !day.isBefore(from) && !day.isAfter(to);
    }

    public boolean overlaps(DateRange other) {
        return !other.to.isBefore(from) && !other.from.isAfter(to);
    }

    /** First day after the range, where a following leave starts. */
    public LocalDate nextDay() {
        return to.plusDays(1);
    }
}
