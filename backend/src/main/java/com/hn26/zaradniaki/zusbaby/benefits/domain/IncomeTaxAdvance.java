package com.hn26.zaradniaki.zusbaby.benefits.domain;

import com.hn26.zaradniaki.zusbaby.shared.domain.Money;
import com.hn26.zaradniaki.zusbaby.shared.domain.Rate;
import java.math.RoundingMode;

/**
 * Net amount of a benefit after the income tax advance, as the frontend
 * prototype simulates it ({@code netto()}): the advance is rounded to whole
 * zloty; no health contribution is taken from benefits.
 */
public final class IncomeTaxAdvance {

    private IncomeTaxAdvance() {
    }

    public static Money net(Money gross, Rate rate) {
        Money advance = new Money(gross.times(rate).amount().setScale(0, RoundingMode.HALF_UP));
        return gross.minus(advance);
    }
}
