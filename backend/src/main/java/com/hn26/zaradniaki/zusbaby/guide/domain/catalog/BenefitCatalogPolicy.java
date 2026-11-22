package com.hn26.zaradniaki.zusbaby.guide.domain.catalog;

import com.hn26.zaradniaki.zusbaby.guide.domain.survey.CareStage;
import com.hn26.zaradniaki.zusbaby.guide.domain.survey.PartnerTracking;
import com.hn26.zaradniaki.zusbaby.guide.domain.survey.Survey;
import com.hn26.zaradniaki.zusbaby.guide.domain.survey.WorkForm;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.List;

/**
 * Benefits of the catalog the family can get, with the same rules as the
 * {@code eligible()} functions of the {@code BENEFITS} catalog in the frontend
 * prototype. Benefits the family cannot get are left out; the order is the
 * catalog's.
 */
public final class BenefitCatalogPolicy {

    private static final int MATERNITY_MAX_MONTHS = 12;
    private static final int PARENTAL_MAX_MONTHS = 84;
    private static final int PATERNITY_MAX_MONTHS = 12;
    private static final int CARE_ALLOWANCE_MAX_MONTHS = 168;
    private static final int AVERAGED_VARIANT_DAYS = 21;

    public List<EntitledBenefit> benefits(Survey survey, Integer childAgeMonths, LocalDate today) {
        Facts facts = new Facts(survey, childAgeMonths == null ? 0 : childAgeMonths, today);
        return Arrays.stream(CatalogBenefit.values())
                .map(benefit -> new EntitledBenefit(benefit, eligibility(benefit, facts)))
                .filter(entitled -> entitled.eligibility() != Eligibility.NO).toList();
    }

    private static Eligibility eligibility(CatalogBenefit benefit, Facts f) {
        return switch (benefit) {
            case L4_CIAZA -> yes(f.pregnancy && f.mother && f.insured);
            case MAC_PRZED -> yes(f.pregnancy && f.mother && f.insured);
            case REHAB -> maybe(f.pregnancy && f.insured);
            case ZWZM -> maybe(f.pregnancy && f.employed);
            case MAC -> f.months > MATERNITY_MAX_MONTHS
                    ? Eligibility.NO
                    : f.stage != CareStage.ADOPTION && f.insured ? Eligibility.YES : maybe(f.father && f.insured);
            case RODZ -> yes(f.insured && f.months < PARENTAL_MAX_MONTHS);
            case WARIANT -> yes(f.mother && f.insured
                    && (f.pregnancy || f.daysSinceBirth != null && f.daysSinceBirth <= AVERAGED_VARIANT_DAYS));
            case UZUP -> yes(f.survey.preterm() != null && f.insured);
            case OJCOWSKI -> !(f.father || f.survey.partner() == PartnerTracking.SHOW_PARTNER)
                    || f.months >= PATERNITY_MAX_MONTHS
                            ? Eligibility.NO
                            : f.father ? yes(f.insured) : Eligibility.MAYBE;
            case ADOPCJA -> yes(f.stage == CareStage.ADOPTION && f.insured);
            case ZAZYCIEM -> yes(f.survey.zaZyciem());
            case OPIEKUNCZY -> yes(!f.pregnancy && f.insured && f.months < CARE_ALLOWANCE_MAX_MONTHS);
            case RYZYKA -> Eligibility.YES;
            case OCHRONA -> yes(f.employed);
        };
    }

    private static Eligibility yes(boolean condition) {
        return condition ? Eligibility.YES : Eligibility.NO;
    }

    private static Eligibility maybe(boolean condition) {
        return condition ? Eligibility.MAYBE : Eligibility.NO;
    }

    /** What the rules look at. */
    private static final class Facts {

        private final Survey survey;
        private final CareStage stage;
        private final boolean pregnancy;
        private final boolean mother;
        private final boolean father;
        private final boolean insured;
        private final boolean employed;
        private final int months;
        private final Long daysSinceBirth;

        Facts(Survey survey, int months, LocalDate today) {
            this.survey = survey;
            this.stage = survey.stage();
            this.pregnancy = stage == CareStage.PREGNANCY;
            this.mother = survey.isMother();
            this.father = survey.isFather();
            this.insured = survey.hasSicknessInsurance();
            this.employed = survey.works(WorkForm.EMPLOYMENT);
            this.months = months;
            this.daysSinceBirth = survey.birthDate() == null
                    ? null
                    : ChronoUnit.DAYS.between(survey.birthDate(), today);
        }
    }
}
