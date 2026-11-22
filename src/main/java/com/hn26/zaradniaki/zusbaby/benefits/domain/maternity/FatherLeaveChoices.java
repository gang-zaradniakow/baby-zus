package com.hn26.zaradniaki.zusbaby.benefits.domain.maternity;

/**
 * How the father wants to use his leave.
 * @param paternityLeave takes the 2-week paternity leave
 * @param parentalWeeks weeks of parental leave (9 are his, non-transferable)
 * @param maternityWeeksTaken weeks of the mother's maternity leave he takes
 *            over (after her first 14 weeks)
 */
public record FatherLeaveChoices(boolean paternityLeave, int parentalWeeks, int maternityWeeksTaken) {
}
