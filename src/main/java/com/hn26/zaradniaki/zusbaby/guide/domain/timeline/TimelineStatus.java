package com.hn26.zaradniaki.zusbaby.guide.domain.timeline;

/** Where a timeline item stands today. */
public enum TimelineStatus {
    /** The deadline has passed. */
    LATE,
    /** Due within 30 days. */
    NOW,
    /** The day has passed (no deadline to miss). */
    PAST,
    FUTURE
}
