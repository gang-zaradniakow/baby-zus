package com.hn26.zaradniaki.zusbaby.benefits.domain.leave;

import com.hn26.zaradniaki.zusbaby.shared.domain.Weeks;

/**
 * Supplementary maternity leave.
 * @param weeks granted weeks (a week for every started week in hospital, up to
 *            the limit)
 * @param limit maximum for the case (15, 8 or 0)
 * @param rule Polish explanation of the rule applied
 */
public record SupplementaryLeave(Weeks weeks, Weeks limit, String rule) {
}
