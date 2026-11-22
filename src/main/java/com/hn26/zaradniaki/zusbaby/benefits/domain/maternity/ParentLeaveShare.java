package com.hn26.zaradniaki.zusbaby.benefits.domain.maternity;

import com.hn26.zaradniaki.zusbaby.shared.domain.Weeks;

/** Weeks of maternity and parental leave taken by one parent. */
public record ParentLeaveShare(Weeks maternityWeeks, Weeks parentalWeeks) {

    static final ParentLeaveShare NONE = new ParentLeaveShare(Weeks.ZERO, Weeks.ZERO);
}
