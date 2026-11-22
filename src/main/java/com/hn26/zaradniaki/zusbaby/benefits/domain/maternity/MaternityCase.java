package com.hn26.zaradniaki.zusbaby.benefits.domain.maternity;

import com.hn26.zaradniaki.zusbaby.benefits.domain.insurance.ResolvedInsurance;
import com.hn26.zaradniaki.zusbaby.benefits.domain.leave.PretermBirth;
import com.hn26.zaradniaki.zusbaby.benefits.domain.leave.TakenInChild;
import java.time.LocalDate;
import java.util.Objects;

/**
 * Everything the simulator needs about a family.
 * @param situation birth or a child taken in
 * @param startDate day of birth or of taking the child in
 * @param children children born or taken in at once
 * @param zaZyciem "Za życiem" certificate
 * @param variant benefit rates
 * @param preterm premature birth (only for a birth), may be {@code null}
 * @param adoption child taken in (required for {@link CareSituation#ADOPTION})
 * @param mother mother's resolved insurance
 * @param father father's resolved insurance
 * @param fatherChoices how the father uses his leave
 * @param work parental leave combined with part-time work, may be {@code null}
 */
public record MaternityCase(CareSituation situation, LocalDate startDate, int children, boolean zaZyciem,
        BenefitVariant variant, PretermBirth preterm, TakenInChild adoption, ResolvedInsurance mother,
        ResolvedInsurance father, FatherLeaveChoices fatherChoices, PartTimeWork work) {

    public MaternityCase {
        Objects.requireNonNull(situation, "situation");
        Objects.requireNonNull(startDate, "startDate");
        Objects.requireNonNull(variant, "variant");
        Objects.requireNonNull(mother, "mother");
        Objects.requireNonNull(father, "father");
        Objects.requireNonNull(fatherChoices, "fatherChoices");
        if (situation == CareSituation.ADOPTION && adoption == null) {
            throw new IllegalArgumentException("A child taken in needs adoption details");
        }
    }
}
