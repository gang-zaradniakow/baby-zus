package com.hn26.zaradniaki.zusbaby.guide.domain;

import com.hn26.zaradniaki.zusbaby.shared.domain.Rate;
import com.hn26.zaradniaki.zusbaby.shared.domain.Weeks;
import java.util.List;
import java.util.Objects;

/**
 * Legal parameters of the guide, taken from the legalrules module.
 * @param maternityWeeksByChildren maternity leave for 1, 2, 3, 4 and 5 or more
 *            children
 * @param maternityRate maternity leave (100%)
 * @param supplementaryRate supplementary maternity leave (100%)
 * @param parentalRate parental leave (70%)
 */
public record GuideParameters(List<Weeks> maternityWeeksByChildren, Rate maternityRate, Rate supplementaryRate,
        Rate parentalRate) {

    private static final int MAX_CHILDREN = 5;

    public GuideParameters {
        maternityWeeksByChildren = List.copyOf(maternityWeeksByChildren);
        if (maternityWeeksByChildren.size() != MAX_CHILDREN) {
            throw new IllegalArgumentException("Maternity leave needs 5 values (1-5+ children)");
        }
        Objects.requireNonNull(maternityRate, "maternityRate");
        Objects.requireNonNull(supplementaryRate, "supplementaryRate");
        Objects.requireNonNull(parentalRate, "parentalRate");
    }

    public Weeks maternityWeeks(int children) {
        return maternityWeeksByChildren.get(Math.clamp(children, 1, MAX_CHILDREN) - 1);
    }
}
