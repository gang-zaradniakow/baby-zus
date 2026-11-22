package com.hn26.zaradniaki.zusbaby.guide.domain;

import com.hn26.zaradniaki.zusbaby.shared.domain.Weeks;
import java.util.Objects;

/**
 * Leave lengths of the family, from the benefits module.
 * @param maternity maternity leave (or leave on maternity terms)
 * @param supplementary supplementary leave for a premature baby (zero when
 *            none)
 * @param parental parental leave
 */
public record LeaveWeeks(Weeks maternity, Weeks supplementary, Weeks parental) {

    public LeaveWeeks {
        Objects.requireNonNull(maternity, "maternity");
        Objects.requireNonNull(supplementary, "supplementary");
        Objects.requireNonNull(parental, "parental");
    }
}
