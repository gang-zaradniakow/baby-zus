package com.hn26.zaradniaki.zusbaby.benefits.domain;

import com.hn26.zaradniaki.zusbaby.shared.domain.Weeks;
import java.util.List;

/**
 * Leave dimensions of the 2026 legal state (same values as the frontend
 * prototype).
 */
public final class LeaveParametersFixtures {

    private LeaveParametersFixtures() {
    }

    public static LeaveParameters legalState2026() {
        return new LeaveParameters(List.of(Weeks.of(20), Weeks.of(31), Weeks.of(33), Weeks.of(35), Weeks.of(37)),
                Weeks.of(41), Weeks.of(43), Weeks.of(65), Weeks.of(67), Weeks.of(9), Weeks.of(38), Weeks.of(62), 7, 10,
                14, Weeks.of(15), Weeks.of(8));
    }
}
