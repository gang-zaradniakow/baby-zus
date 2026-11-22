package com.hn26.zaradniaki.zusbaby.benefits.domain.maternity;

import com.hn26.zaradniaki.zusbaby.shared.domain.DateRange;
import com.hn26.zaradniaki.zusbaby.shared.domain.Money;
import com.hn26.zaradniaki.zusbaby.shared.domain.Rate;
import com.hn26.zaradniaki.zusbaby.shared.domain.Weeks;

/**
 * One leave on the family timeline.
 * @param parent who takes it
 * @param label Polish name of the leave
 * @param weeks length (rounded to 0.1 week)
 * @param rate benefit rate
 * @param workFactor part of the benefit kept while working part-time (1 when
 *            not working)
 * @param period calendar days of the leave
 * @param monthlyGross benefit for a month of this leave
 * @param monthlyNet as above, after the income tax advance (at least the
 *            minimum when not working)
 * @param total benefit for the whole leave, after the income tax advance
 */
public record LeaveSegment(Parent parent, String label, Weeks weeks, Rate rate, Rate workFactor, DateRange period,
        Money monthlyGross, Money monthlyNet, Money total) {
}
