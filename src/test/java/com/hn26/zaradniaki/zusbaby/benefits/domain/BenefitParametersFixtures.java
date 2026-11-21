package com.hn26.zaradniaki.zusbaby.benefits.domain;

import com.hn26.zaradniaki.zusbaby.shared.domain.Money;
import com.hn26.zaradniaki.zusbaby.shared.domain.Rate;

/**
 * Benefit parameters of the 2026 legal state (same values as the frontend
 * prototype).
 */
public final class BenefitParametersFixtures {

    private BenefitParametersFixtures() {
    }

    public static BenefitParameters legalState2026() {
        return new BenefitParameters(Money.of(4806), Rate.of("0.1371"), Money.of("4147.10"), Money.of("20321.30"),
                Money.of("48.06"));
    }
}
