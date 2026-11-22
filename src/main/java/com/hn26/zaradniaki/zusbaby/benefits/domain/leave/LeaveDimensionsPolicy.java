package com.hn26.zaradniaki.zusbaby.benefits.domain.leave;

import com.hn26.zaradniaki.zusbaby.benefits.domain.LeaveParameters;
import com.hn26.zaradniaki.zusbaby.shared.domain.Weeks;

/**
 * Standard leave dimensions after birth ({@code macierzynskiWeeks()} /
 * {@code rodzicielskiWeeks()} of the mockup).
 */
public final class LeaveDimensionsPolicy {

    /** 20, 31, 33, 35, 37 weeks for 1–5+ children. */
    public Weeks maternityWeeks(int children, LeaveParameters parameters) {
        requireChildren(children);
        return parameters.maternityWeeksByChildren().get(Math.min(children, 5) - 1);
    }

    /** 41 / 43 weeks, 65 / 67 with the "Za życiem" certificate. */
    public Weeks parentalWeeks(int children, boolean zaZyciem, LeaveParameters parameters) {
        requireChildren(children);
        boolean multiple = children > 1;
        if (zaZyciem) {
            return multiple
                    ? parameters.parentalWeeksZaZyciemMultipleChildren()
                    : parameters.parentalWeeksZaZyciemOneChild();
        }
        return multiple ? parameters.parentalWeeksMultipleChildren() : parameters.parentalWeeksOneChild();
    }

    private static void requireChildren(int children) {
        if (children < 1) {
            throw new IllegalArgumentException("Number of children must be at least 1, was " + children);
        }
    }
}
