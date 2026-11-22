package com.hn26.zaradniaki.zusbaby.benefits.domain;

import com.hn26.zaradniaki.zusbaby.shared.domain.Rate;

/**
 * Sickness benefit parameters of the 2026 legal state (same values as the
 * frontend prototype).
 */
public final class SicknessParametersFixtures {

    private SicknessParametersFixtures() {
    }

    public static SicknessParameters legalState2026() {
        return new SicknessParameters(30, 90, 270, 33, 14, Rate.ONE, Rate.ONE, 12, Rate.of("0.12"));
    }
}
