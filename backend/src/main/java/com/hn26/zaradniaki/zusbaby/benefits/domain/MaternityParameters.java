package com.hn26.zaradniaki.zusbaby.benefits.domain;

import com.hn26.zaradniaki.zusbaby.shared.domain.Money;
import com.hn26.zaradniaki.zusbaby.shared.domain.Rate;
import com.hn26.zaradniaki.zusbaby.shared.domain.Weeks;
import java.util.List;
import java.util.Objects;

/**
 * Legal parameters of the maternity benefit simulator, taken from the
 * legalrules module.
 * @param maternityRate maternity leave (100%)
 * @param parentalRate parental leave (70%)
 * @param averagedRate averaged variant (81.5%)
 * @param supplementaryRate supplementary maternity leave (100%)
 * @param paternityRate paternity leave (100%)
 * @param nonTransferableParentalWeeks parental weeks of each parent that cannot
 *            be transferred (9)
 * @param paternityWeeks paternity leave (2)
 * @param motherOnlyMaternityWeeks maternity weeks only the mother can use (14)
 * @param debtThreshold contribution debt above which a self-employed parent's
 *            benefit is blocked
 * @param parentalWithWorkMaxWeeksOneChild longest parental leave combined with
 *            work, one child
 * @param parentalWithWorkMaxWeeksMultipleChildren as above, more children
 * @param parentalWithWorkMaxWeeksZaZyciemOneChild as above, "Za życiem"
 *            certificate, one child
 * @param parentalWithWorkMaxWeeksZaZyciemMultipleChildren as above, "Za życiem"
 *            certificate, more children
 * @param minimumMonthlyBenefit lowest monthly benefit after the income tax
 *            advance (art. 31 ust. 3a), also the parental allowance
 * @param incomeTaxAdvanceRate income tax advance taken from the benefit
 * @param parentalAllowanceWeeksByChildren parental allowance for 1, 2, 3, 4 and
 *            5 or more children
 */
public record MaternityParameters(Rate maternityRate, Rate parentalRate, Rate averagedRate, Rate supplementaryRate,
        Rate paternityRate, Weeks nonTransferableParentalWeeks, Weeks paternityWeeks, Weeks motherOnlyMaternityWeeks,
        Money debtThreshold, Weeks parentalWithWorkMaxWeeksOneChild, Weeks parentalWithWorkMaxWeeksMultipleChildren,
        Weeks parentalWithWorkMaxWeeksZaZyciemOneChild, Weeks parentalWithWorkMaxWeeksZaZyciemMultipleChildren,
        Money minimumMonthlyBenefit, Rate incomeTaxAdvanceRate, List<Weeks> parentalAllowanceWeeksByChildren) {

    public MaternityParameters {
        Objects.requireNonNull(maternityRate, "maternityRate");
        Objects.requireNonNull(parentalRate, "parentalRate");
        Objects.requireNonNull(averagedRate, "averagedRate");
        Objects.requireNonNull(supplementaryRate, "supplementaryRate");
        Objects.requireNonNull(paternityRate, "paternityRate");
        Objects.requireNonNull(nonTransferableParentalWeeks, "nonTransferableParentalWeeks");
        Objects.requireNonNull(paternityWeeks, "paternityWeeks");
        Objects.requireNonNull(motherOnlyMaternityWeeks, "motherOnlyMaternityWeeks");
        Objects.requireNonNull(debtThreshold, "debtThreshold");
        Objects.requireNonNull(parentalWithWorkMaxWeeksOneChild, "parentalWithWorkMaxWeeksOneChild");
        Objects.requireNonNull(parentalWithWorkMaxWeeksMultipleChildren, "parentalWithWorkMaxWeeksMultipleChildren");
        Objects.requireNonNull(parentalWithWorkMaxWeeksZaZyciemOneChild, "parentalWithWorkMaxWeeksZaZyciemOneChild");
        Objects.requireNonNull(parentalWithWorkMaxWeeksZaZyciemMultipleChildren,
                "parentalWithWorkMaxWeeksZaZyciemMultipleChildren");
        Objects.requireNonNull(minimumMonthlyBenefit, "minimumMonthlyBenefit");
        Objects.requireNonNull(incomeTaxAdvanceRate, "incomeTaxAdvanceRate");
        parentalAllowanceWeeksByChildren = List.copyOf(parentalAllowanceWeeksByChildren);
        if (parentalAllowanceWeeksByChildren.size() != 5) {
            throw new IllegalArgumentException("Parental allowance needs 5 values (1-5+ children)");
        }
    }
}
