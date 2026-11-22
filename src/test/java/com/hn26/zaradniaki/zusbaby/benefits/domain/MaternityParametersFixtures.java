package com.hn26.zaradniaki.zusbaby.benefits.domain;

import com.hn26.zaradniaki.zusbaby.shared.domain.Money;
import com.hn26.zaradniaki.zusbaby.shared.domain.Rate;
import com.hn26.zaradniaki.zusbaby.shared.domain.Weeks;

/**
 * Maternity simulator parameters of the 2026 legal state (same values as the
 * frontend prototype).
 */
public final class MaternityParametersFixtures {

    private MaternityParametersFixtures() {
    }

    public static MaternityParameters legalState2026() {
        return new MaternityParameters(Rate.ONE, Rate.of("0.7"), Rate.of("0.815"), Rate.ONE, Rate.ONE, Weeks.of(9),
                Weeks.of(2), Weeks.of(14), Money.of("48.06"));
    }
}
