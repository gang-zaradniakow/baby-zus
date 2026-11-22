package com.hn26.zaradniaki.zusbaby.guide.domain;

import com.hn26.zaradniaki.zusbaby.shared.domain.Weeks;
import java.util.List;

/**
 * Legal parameters of the guide, taken from the legalrules module.
 * @param maternityWeeksByChildren maternity leave for 1, 2, 3, 4 and 5 or more
 *            children
 */
public record GuideParameters(List<Weeks> maternityWeeksByChildren) {

    private static final int MAX_CHILDREN = 5;

    public GuideParameters {
        maternityWeeksByChildren = List.copyOf(maternityWeeksByChildren);
        if (maternityWeeksByChildren.size() != MAX_CHILDREN) {
            throw new IllegalArgumentException("Maternity leave needs 5 values (1-5+ children)");
        }
    }

    public Weeks maternityWeeks(int children) {
        return maternityWeeksByChildren.get(Math.clamp(children, 1, MAX_CHILDREN) - 1);
    }
}
