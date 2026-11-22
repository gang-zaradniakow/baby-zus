package com.hn26.zaradniaki.zusbaby.benefits.domain.insurance;

import com.hn26.zaradniaki.zusbaby.shared.domain.Check;
import com.hn26.zaradniaki.zusbaby.shared.domain.Money;
import java.util.List;

/**
 * Result of resolving concurrent insurance titles.
 * @param mainTitle title the benefit is mainly calculated from; {@code null}
 *            when no title gives a benefit
 * @param base sum of the bases of {@code parts}
 * @param parts titles that give a benefit
 * @param checks explanation of every decision (Polish)
 * @param agriculturalInsurance the person is also insured in KRUS
 * @param blockingDebt debt that blocks the only title (zero otherwise)
 */
public record ResolvedInsurance(InsuranceTitle mainTitle, Money base, List<TitleBase> parts, List<Check> checks,
        boolean agriculturalInsurance, Money blockingDebt) {

    public ResolvedInsurance {
        parts = List.copyOf(parts);
        checks = List.copyOf(checks);
    }
}
