package com.hn26.zaradniaki.zusbaby.benefits.domain;

import com.hn26.zaradniaki.zusbaby.shared.domain.Money;
import com.hn26.zaradniaki.zusbaby.shared.domain.Rate;
import com.hn26.zaradniaki.zusbaby.shared.domain.Weeks;
import java.util.stream.Stream;

/**
 * Maternity simulator parameters of the 2026 legal state (same values as the
 * frontend prototype).
 */
public final class MaternityParametersFixtures {

    private MaternityParametersFixtures() {
    }

    public static MaternityParameters legalState2026() {
        return new MaternityParameters(Rate.ONE, Rate.of("0.7"), Rate.of("0.815"), Rate.ONE, Rate.ONE, Weeks.of(9),
                Weeks.of(2), Weeks.of(14), Money.of("48.06"), Weeks.of(82), Weeks.of(86), Weeks.of(130), Weeks.of(134),
                Money.of(1000), Rate.of("0.12"), Stream.of(52, 65, 67, 69, 71).map(Weeks::of).toList());
    }
}
