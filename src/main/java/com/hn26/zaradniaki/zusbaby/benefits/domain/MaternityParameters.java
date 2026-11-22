package com.hn26.zaradniaki.zusbaby.benefits.domain;

import com.hn26.zaradniaki.zusbaby.shared.domain.Money;
import com.hn26.zaradniaki.zusbaby.shared.domain.Rate;
import com.hn26.zaradniaki.zusbaby.shared.domain.Weeks;
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
 */
public record MaternityParameters(Rate maternityRate, Rate parentalRate, Rate averagedRate, Rate supplementaryRate,
        Rate paternityRate, Weeks nonTransferableParentalWeeks, Weeks paternityWeeks, Weeks motherOnlyMaternityWeeks,
        Money debtThreshold) {

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
    }
}
