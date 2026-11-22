package com.hn26.zaradniaki.zusbaby.benefits.domain.leave;

import com.hn26.zaradniaki.zusbaby.shared.domain.Weeks;

/**
 * Leave for a child taken in.
 * @param maternityWeeks leave on maternity terms (zero when the child is
 *            already over the age limit)
 * @param parentalWeeks parental leave
 * @param ageLimit age limit that applies (years)
 * @param note Polish explanation
 */
public record AdoptionLeave(Weeks maternityWeeks, Weeks parentalWeeks, int ageLimit, String note) {
}
