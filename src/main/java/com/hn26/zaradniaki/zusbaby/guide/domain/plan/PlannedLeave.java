package com.hn26.zaradniaki.zusbaby.guide.domain.plan;

import com.hn26.zaradniaki.zusbaby.shared.domain.Rate;
import com.hn26.zaradniaki.zusbaby.shared.domain.Weeks;

/**
 * One leave on the bar of the benefit plan.
 * @param kind which leave
 * @param label Polish name
 * @param weeks length
 * @param rate benefit rate
 */
public record PlannedLeave(LeaveKind kind, String label, Weeks weeks, Rate rate) {
}
