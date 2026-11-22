package com.hn26.zaradniaki.zusbaby.calendar.api.model;

/** How a statutory deadline is counted. */
public enum DeadlineType {

    /**
     * "Within X days (or months) of the event" (Code of Administrative Procedure
     * art. 57 § 4, Civil Code art. 115): a deadline ending on a Saturday, Sunday or
     * public holiday moves to the next working day.
     */
    AFTER,
    /**
     * "At least X days before the event" (Labour Code): counted backwards and never
     * moved forward, because moving it would make the application late.
     */
    BEFORE
}
