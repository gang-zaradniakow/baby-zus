package com.hn26.zaradniaki.zusbaby.benefits.domain.sickness;

import com.hn26.zaradniaki.zusbaby.benefits.domain.insurance.InsuranceTitle;
import com.hn26.zaradniaki.zusbaby.shared.domain.Money;
import com.hn26.zaradniaki.zusbaby.shared.domain.Rate;

/**
 * One period of the sick leave paid in one way.
 * @param title insurance title it is paid from
 * @param label Polish description (prefixed with the title when there are
 *            several titles)
 * @param days days in the period
 * @param rate part of the base paid
 * @param amount gross amount for the period
 */
public record SicknessPayPart(InsuranceTitle title, String label, int days, Rate rate, Money amount) {
}
