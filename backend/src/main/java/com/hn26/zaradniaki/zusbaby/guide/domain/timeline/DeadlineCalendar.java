package com.hn26.zaradniaki.zusbaby.guide.domain.timeline;

import java.time.LocalDate;

/** Port: statutory deadlines counted with the Polish calendar. */
public interface DeadlineCalendar {

    /** Within {@code days} after {@code event}, moved to the next working day. */
    TimelineDeadline daysAfter(LocalDate event, int days);

    /** At least {@code days} before {@code event}, never moved forward. */
    TimelineDeadline daysBefore(LocalDate event, int days);
}
