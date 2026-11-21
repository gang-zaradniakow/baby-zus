package com.hn26.zaradniaki.zusbaby.calendar.domain;

import com.hn26.zaradniaki.zusbaby.calendar.api.model.DeadlineType;
import java.time.LocalDate;
import java.util.Objects;

/**
 * Counts statutory deadlines with the Polish calendar ("strażnik terminów").
 */
public final class DeadlinePolicy {

    private final WorkingDays workingDays;

    public DeadlinePolicy(WorkingDays workingDays) {
        this.workingDays = Objects.requireNonNull(workingDays, "workingDays");
    }

    /**
     * "Within {@code days} days of {@code event}". A deadline ending on a day off
     * moves to the next working day; the safe day is the last working day before
     * the legal one.
     */
    public Deadline daysAfter(LocalDate event, int days) {
        requirePositive(days);
        return after(event.plusDays(days));
    }

    /**
     * "Within {@code months} months of {@code event}" (end of a shorter month is
     * its last day).
     */
    public Deadline monthsAfter(LocalDate event, int months) {
        requirePositive(months);
        return after(event.plusMonths(months));
    }

    /**
     * "At least {@code days} days before {@code event}". Counted backwards and
     * never moved forward; when it falls on a day off the safe day is the working
     * day before it.
     */
    public Deadline daysBefore(LocalDate event, int days) {
        requirePositive(days);
        LocalDate raw = event.minusDays(days);
        return new Deadline(DeadlineType.BEFORE, raw, raw, false, workingDays.dayOffReason(raw).orElse(null),
                workingDays.onOrBefore(raw));
    }

    private Deadline after(LocalDate raw) {
        LocalDate legal = workingDays.onOrAfter(raw);
        boolean shifted = !legal.equals(raw);
        String reason = shifted ? workingDays.dayOffReason(raw).orElseThrow() : null;
        LocalDate safe = workingDays.onOrBefore(legal.minusDays(1));
        return new Deadline(DeadlineType.AFTER, raw, legal, shifted, reason, safe);
    }

    private static void requirePositive(int amount) {
        if (amount < 1) {
            throw new IllegalArgumentException("Deadline period must be positive, was " + amount);
        }
    }
}
