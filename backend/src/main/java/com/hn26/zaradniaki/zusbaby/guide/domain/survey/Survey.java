package com.hn26.zaradniaki.zusbaby.guide.domain.survey;

import java.math.BigDecimal;
import java.math.MathContext;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.EnumSet;
import java.util.Objects;
import java.util.Set;

/**
 * Answers of the guest survey ("Twoja sytuacja" in the frontend prototype).
 * @param role who fills it in
 * @param stage pregnancy, born child or a child taken in
 * @param date due date, birth date or the day the child was taken in
 * @param childBirthDate birth date of a child taken in (only for
 *            {@link CareStage#ADOPTION})
 * @param children children born or taken in at once
 * @param preterm premature baby, may be {@code null} (only for a born child)
 * @param zaZyciem "Za życiem" certificate (not for a pregnancy)
 * @param work how the parent works, at least one
 * @param partner what to show about the other parent
 */
public record Survey(ParentRole role, CareStage stage, LocalDate date, LocalDate childBirthDate, int children,
        PretermDetails preterm, boolean zaZyciem, Set<WorkForm> work, PartnerTracking partner) {

    private static final BigDecimal DAYS_IN_YEAR = new BigDecimal("365.25");

    public Survey {
        Objects.requireNonNull(role, "role");
        Objects.requireNonNull(stage, "stage");
        Objects.requireNonNull(date, "date");
        Objects.requireNonNull(partner, "partner");
        if (work == null || work.isEmpty()) {
            throw new IllegalArgumentException("The survey needs at least one form of work");
        }
        work = Set.copyOf(EnumSet.copyOf(work));
        if ((stage == CareStage.ADOPTION) != (childBirthDate != null)) {
            throw new IllegalArgumentException("Child birth date is given only for a child taken in");
        }
        if (stage != CareStage.CHILD && preterm != null) {
            throw new IllegalArgumentException("A premature baby is given only for a born child");
        }
        if (stage == CareStage.PREGNANCY && zaZyciem) {
            throw new IllegalArgumentException("The \"Za życiem\" certificate is given after birth");
        }
        if (children < 1) {
            throw new IllegalArgumentException("At least one child, was " + children);
        }
    }

    public boolean works(WorkForm form) {
        return work.contains(form);
    }

    /**
     * Sickness insurance from employment, or voluntary from a firm or a mandate
     * contract.
     */
    public boolean hasSicknessInsurance() {
        return works(WorkForm.EMPLOYMENT) || works(WorkForm.SELF_EMPLOYMENT) || works(WorkForm.MANDATE_CONTRACT);
    }

    public boolean isMother() {
        return role == ParentRole.MOTHER;
    }

    public boolean isFather() {
        return role == ParentRole.FATHER;
    }

    /**
     * Age in years of a child taken in, on the day it was taken in (days / 365.25,
     * as in the prototype).
     */
    public BigDecimal childAgeWhenTakenIn() {
        if (stage != CareStage.ADOPTION) {
            throw new IllegalStateException("Only a child taken in has an age when taken in");
        }
        return BigDecimal.valueOf(ChronoUnit.DAYS.between(childBirthDate, date)).divide(DAYS_IN_YEAR,
                MathContext.DECIMAL64);
    }

    /** Birth date of the child, {@code null} during pregnancy. */
    public LocalDate birthDate() {
        return switch (stage) {
            case PREGNANCY -> null;
            case CHILD -> date;
            case ADOPTION -> childBirthDate;
        };
    }
}
