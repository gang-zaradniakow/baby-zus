package com.hn26.zaradniaki.zusbaby.benefits.domain.insurance;

import com.hn26.zaradniaki.zusbaby.shared.domain.Money;

/**
 * A title that gives a benefit, with its own base (each title is calculated
 * separately).
 */
public record TitleBase(InsuranceTitle title, Money base) {
}
