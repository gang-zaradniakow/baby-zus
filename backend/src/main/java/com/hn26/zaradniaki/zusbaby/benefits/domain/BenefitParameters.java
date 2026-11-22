package com.hn26.zaradniaki.zusbaby.benefits.domain;

import com.hn26.zaradniaki.zusbaby.shared.domain.Money;
import com.hn26.zaradniaki.zusbaby.shared.domain.Rate;
import java.util.Objects;

/**
 * Legal parameters the benefit calculations need, taken from the legalrules
 * module.
 * @param minimumWage minimum wage (gross)
 * @param employeeContributionRate employee social contributions deducted from
 *            the pay (13.71%)
 * @param minimumBenefitBase minimum benefit base for full-time employment
 * @param maximumVoluntaryBenefitBase cap of the base for voluntary sickness
 *            insurance
 * @param debtThreshold contribution debt above which the benefit of a
 *            self-employed person is blocked
 */
public record BenefitParameters(Money minimumWage, Rate employeeContributionRate, Money minimumBenefitBase,
        Money maximumVoluntaryBenefitBase, Money debtThreshold) {

    public BenefitParameters {
        Objects.requireNonNull(minimumWage, "minimumWage");
        Objects.requireNonNull(employeeContributionRate, "employeeContributionRate");
        Objects.requireNonNull(minimumBenefitBase, "minimumBenefitBase");
        Objects.requireNonNull(maximumVoluntaryBenefitBase, "maximumVoluntaryBenefitBase");
        Objects.requireNonNull(debtThreshold, "debtThreshold");
    }
}
