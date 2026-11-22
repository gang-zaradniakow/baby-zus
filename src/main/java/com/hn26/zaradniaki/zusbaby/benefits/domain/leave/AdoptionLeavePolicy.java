package com.hn26.zaradniaki.zusbaby.benefits.domain.leave;

import com.hn26.zaradniaki.zusbaby.benefits.domain.LeaveParameters;
import com.hn26.zaradniaki.zusbaby.shared.domain.Weeks;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Objects;

/**
 * Leave on maternity terms for a child taken in (art. 183 § 3 and § 4 KP), same
 * rules and messages as {@code adoptWeeks()} of the frontend prototype: the
 * leave lasts until the child reaches the age limit, but not less than the
 * minimum; then the parental leave is shortened as well.
 */
public final class AdoptionLeavePolicy {

    /** Weeks per year used by the prototype to convert the remaining years. */
    private static final BigDecimal WEEKS_PER_YEAR = new BigDecimal("52.18");

    private final LeaveDimensionsPolicy dimensions;

    public AdoptionLeavePolicy(LeaveDimensionsPolicy dimensions) {
        this.dimensions = Objects.requireNonNull(dimensions, "dimensions");
    }

    public AdoptionLeave leave(int children, boolean zaZyciem, TakenInChild child, LeaveParameters parameters) {
        Weeks standardMaternity = dimensions.maternityWeeks(children, parameters);
        Weeks standardParental = dimensions.parentalWeeks(children, zaZyciem, parameters);
        int limit = ageLimit(child, parameters);
        long weeksLeft = BigDecimal.valueOf(limit).subtract(child.childAge()).multiply(WEEKS_PER_YEAR)
                .setScale(0, RoundingMode.FLOOR).longValueExact();
        if (weeksLeft <= 0) {
            return new AdoptionLeave(Weeks.ZERO, Weeks.ZERO, limit,
                    "Dziecko ma już %d lat — urlop na warunkach urlopu macierzyńskiego nie przysługuje.".formatted(limit));
        }
        if (Weeks.of(weeksLeft).compareTo(standardMaternity) >= 0) {
            return new AdoptionLeave(standardMaternity, standardParental, limit,
                    "Pełny wymiar: %s tyg. + rodzicielski %s tyg. (limit wieku: %d lat).".formatted(
                            standardMaternity.value(), standardParental.value(), limit));
        }
        Weeks parental = zaZyciem
                ? parameters.adoptionParentalMinimumWeeksZaZyciem()
                : parameters.adoptionParentalMinimumWeeks();
        Weeks maternity = Weeks.of(weeksLeft).max(parameters.adoptionMinimumWeeks());
        return new AdoptionLeave(maternity, parental, limit,
                "Dziecko zbliża się do limitu wieku (%d lat): urlop trwa do tego wieku, ale nie krócej niż %s tyg.; rodzicielski %s tyg. (art. 183 § 3 i § 4 KP)."
                        .formatted(limit, parameters.adoptionMinimumWeeks().value(), parental.value()));
    }

    private static int ageLimit(TakenInChild child, LeaveParameters parameters) {
        return switch (child.type()) {
            case ADOPTION -> parameters.adoptedChildAgeLimit();
            case FOSTER_FAMILY -> child.deferredSchool()
                    ? parameters.fosterChildAgeLimitDeferredSchool()
                    : parameters.fosterChildAgeLimit();
        };
    }
}
