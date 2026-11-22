package com.hn26.zaradniaki.zusbaby.benefits.domain.maternity;

import com.hn26.zaradniaki.zusbaby.benefits.domain.MaternityParameters;
import com.hn26.zaradniaki.zusbaby.benefits.domain.insurance.ResolvedInsurance;
import com.hn26.zaradniaki.zusbaby.shared.domain.Money;
import com.hn26.zaradniaki.zusbaby.shared.domain.Weeks;
import java.util.Optional;

/**
 * What a mother without any ZUS title gets instead of the maternity benefit,
 * same as {@code zamiastZUS()} of the frontend prototype: a farmer gets the
 * maternity benefit from KRUS, anybody else the parental allowance from the
 * municipality; both at the minimum monthly amount, as long as the parental
 * allowance for the number of children.
 */
public final class AlternativeBenefitPolicy {

    private static final int MAX_CHILDREN = 5;

    public Optional<AlternativeBenefit> forMother(ResolvedInsurance mother, int children,
            MaternityParameters parameters) {
        if (mother.mainTitle() != null) {
            return Optional.empty();
        }
        Weeks weeks = parameters.parentalAllowanceWeeksByChildren().get(Math.clamp(children, 1, MAX_CHILDREN) - 1);
        Money monthly = parameters.minimumMonthlyBenefit();
        return Optional.of(mother.agriculturalInsurance()
                ? new AlternativeBenefit(AlternativeBenefitKind.KRUS, "Zasiłek macierzyński z KRUS",
                        "wypłaca KRUS (nie ZUS)", monthly, weeks)
                : new AlternativeBenefit(AlternativeBenefitKind.MUNICIPALITY, "Świadczenie rodzicielskie",
                        "wniosek w gminie / MOPS (nie ZUS)", monthly, weeks));
    }
}
