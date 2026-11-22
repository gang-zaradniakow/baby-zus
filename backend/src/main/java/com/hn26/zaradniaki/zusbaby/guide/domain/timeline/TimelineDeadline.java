package com.hn26.zaradniaki.zusbaby.guide.domain.timeline;

import com.hn26.zaradniaki.zusbaby.calendar.api.model.DeadlineType;
import java.time.LocalDate;

/**
 * Statutory deadline of a timeline item, as the calendar counts it.
 * @param type counted after or before the event
 * @param raw day counted from the event, before any shift
 * @param legal last legally valid day
 * @param shifted whether {@code legal} was moved from a day off
 * @param reason why {@code raw} is a day off, {@code null} for a working day
 * @param safe recommended day to act
 */
public record TimelineDeadline(DeadlineType type, LocalDate raw, LocalDate legal, boolean shifted, String reason,
        LocalDate safe) {

    /** Day the item is due: the raw day before an event, the legal day after it. */
    LocalDate due() {
        return type == DeadlineType.BEFORE ? raw : legal;
    }
}
