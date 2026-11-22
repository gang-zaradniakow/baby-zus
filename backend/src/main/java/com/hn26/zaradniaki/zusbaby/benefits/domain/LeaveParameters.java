package com.hn26.zaradniaki.zusbaby.benefits.domain;

import com.hn26.zaradniaki.zusbaby.shared.domain.Weeks;
import java.util.List;
import java.util.Objects;

/**
 * Legal leave dimensions (Labour Code), taken from the legalrules module.
 * @param maternityWeeksByChildren maternity leave for 1, 2, 3, 4 and 5 or more
 *            children
 * @param parentalWeeksOneChild parental leave, one child
 * @param parentalWeeksMultipleChildren parental leave, more children
 * @param parentalWeeksZaZyciemOneChild parental leave with the "Za życiem"
 *            certificate, one child
 * @param parentalWeeksZaZyciemMultipleChildren parental leave with the "Za
 *            życiem" certificate, more children
 * @param adoptionMinimumWeeks shortest leave on maternity terms for a child
 *            taken in
 * @param adoptionParentalMinimumWeeks parental leave when the leave on
 *            maternity terms is shortened by the age limit
 * @param adoptionParentalMinimumWeeksZaZyciem as above, with the "Za życiem"
 *            certificate
 * @param fosterChildAgeLimit age limit for a foster family (years)
 * @param fosterChildAgeLimitDeferredSchool age limit for a foster family when
 *            compulsory schooling is deferred (years)
 * @param adoptedChildAgeLimit age limit for adoption (years)
 * @param supplementaryMaxWeeksExtremePreterm supplementary maternity leave,
 *            birth before the 28th week or up to 1000 g
 * @param supplementaryMaxWeeks supplementary maternity leave, other cases
 */
public record LeaveParameters(List<Weeks> maternityWeeksByChildren, Weeks parentalWeeksOneChild,
        Weeks parentalWeeksMultipleChildren, Weeks parentalWeeksZaZyciemOneChild,
        Weeks parentalWeeksZaZyciemMultipleChildren, Weeks adoptionMinimumWeeks, Weeks adoptionParentalMinimumWeeks,
        Weeks adoptionParentalMinimumWeeksZaZyciem, int fosterChildAgeLimit, int fosterChildAgeLimitDeferredSchool,
        int adoptedChildAgeLimit, Weeks supplementaryMaxWeeksExtremePreterm, Weeks supplementaryMaxWeeks) {

    public LeaveParameters {
        maternityWeeksByChildren = List.copyOf(maternityWeeksByChildren);
        if (maternityWeeksByChildren.size() != 5) {
            throw new IllegalArgumentException("Maternity leave needs 5 values (1-5+ children)");
        }
        Objects.requireNonNull(parentalWeeksOneChild, "parentalWeeksOneChild");
        Objects.requireNonNull(parentalWeeksMultipleChildren, "parentalWeeksMultipleChildren");
        Objects.requireNonNull(parentalWeeksZaZyciemOneChild, "parentalWeeksZaZyciemOneChild");
        Objects.requireNonNull(parentalWeeksZaZyciemMultipleChildren, "parentalWeeksZaZyciemMultipleChildren");
        Objects.requireNonNull(adoptionMinimumWeeks, "adoptionMinimumWeeks");
        Objects.requireNonNull(adoptionParentalMinimumWeeks, "adoptionParentalMinimumWeeks");
        Objects.requireNonNull(adoptionParentalMinimumWeeksZaZyciem, "adoptionParentalMinimumWeeksZaZyciem");
        Objects.requireNonNull(supplementaryMaxWeeksExtremePreterm, "supplementaryMaxWeeksExtremePreterm");
        Objects.requireNonNull(supplementaryMaxWeeks, "supplementaryMaxWeeks");
    }
}
