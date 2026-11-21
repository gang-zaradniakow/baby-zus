package com.hn26.zaradniaki.zusbaby.benefits.domain.base;

import com.hn26.zaradniaki.zusbaby.shared.domain.Money;

/**
 * Benefit base calculated from monthly pay.
 * @param base benefit base (average minus contributions, with the minimum or
 *            the cap applied)
 * @param average average gross pay of the counted months
 * @param monthsCounted months included in the average
 * @param note Polish explanation of the calculation
 */
public record BenefitBase(Money base, Money average, int monthsCounted, String note) {
}
