package com.hn26.zaradniaki.zusbaby.guide.domain.timeline;

import java.time.LocalDate;

/**
 * One matter on the family timeline.
 * @param key stable identifier (e.g. {@code w81})
 * @param title Polish title
 * @param description Polish explanation, may be {@code null}
 * @param lateNote shown when the deadline has passed, may be {@code null}
 * @param institution who handles it
 * @param date day of the matter
 * @param deadline statutory deadline, may be {@code null}
 * @param articleId article of the guide, may be {@code null}
 * @param wizardId application wizard, may be {@code null}
 * @param calculator calculator to open, may be {@code null}
 * @param optional the parent may skip it
 * @param estimate the date is estimated (e.g. from the due date)
 * @param milestone a point in time, nothing to submit
 * @param due day it is due: the deadline's due day, otherwise {@code date}
 * @param daysLeft days from today to {@code due} (negative when passed)
 * @param status where it stands today
 */
public record TimelineItem(String key, String title, String description, String lateNote, Institution institution,
        LocalDate date, TimelineDeadline deadline, String articleId, String wizardId, String calculator,
        boolean optional, boolean estimate, boolean milestone, LocalDate due, long daysLeft, TimelineStatus status) {
}
