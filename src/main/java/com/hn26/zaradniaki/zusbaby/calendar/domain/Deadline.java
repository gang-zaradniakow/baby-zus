package com.hn26.zaradniaki.zusbaby.calendar.domain;

import com.hn26.zaradniaki.zusbaby.calendar.api.model.DeadlineType;
import java.time.LocalDate;
import java.util.Objects;

/**
 * Calculated statutory deadline.
 * @param type how it was counted
 * @param raw day counted from the event, before any shift
 * @param legal last legally valid day
 * @param shifted whether {@code legal} was moved because {@code raw} is a day
 *            off
 * @param reason why {@code raw} is a day off (holiday name, {@code sobota},
 *            {@code niedziela}); {@code null} for a working day
 * @param safe recommended day to act: a working day before the deadline
 */
public record Deadline(DeadlineType type, LocalDate raw, LocalDate legal, boolean shifted, String reason,
        LocalDate safe) {

    public Deadline {
        Objects.requireNonNull(type, "type");
        Objects.requireNonNull(raw, "raw");
        Objects.requireNonNull(legal, "legal");
        Objects.requireNonNull(safe, "safe");
    }
}
