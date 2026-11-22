package com.hn26.zaradniaki.zusbaby.benefits.domain.maternity;

import com.hn26.zaradniaki.zusbaby.shared.domain.Money;
import com.hn26.zaradniaki.zusbaby.shared.domain.Weeks;

/**
 * Benefit a mother gets instead of the ZUS maternity benefit.
 * @param kind who pays it
 * @param title Polish name of the benefit
 * @param payer who pays it and where to apply (Polish)
 * @param monthly monthly amount
 * @param weeks how long it is paid
 */
public record AlternativeBenefit(AlternativeBenefitKind kind, String title, String payer, Money monthly,
        Weeks weeks) {
}
