package com.hn26.zaradniaki.zusbaby.benefits.domain;

import com.hn26.zaradniaki.zusbaby.shared.domain.Rate;
import java.util.Objects;

/**
 * Legal parameters of sickness benefits, taken from the legalrules module.
 * @param waitingPeriodMandatoryDays waiting period for mandatory sickness
 *            insurance (employment)
 * @param waitingPeriodVoluntaryDays waiting period for voluntary sickness
 *            insurance
 * @param pregnancyBenefitPeriodDays benefit period in pregnancy
 * @param sickPayDays sick-pay days paid by the employer in a calendar year
 * @param sickPayDaysAge50 sick-pay days from the age of 50
 * @param pregnancySicknessRate sickness benefit in pregnancy (100%)
 * @param pregnancyRehabilitationRate rehabilitation benefit in pregnancy (100%)
 * @param rehabilitationMaxMonths longest rehabilitation benefit
 * @param incomeTaxAdvanceRate income tax advance deducted from the benefit
 *            (simulation)
 */
public record SicknessParameters(int waitingPeriodMandatoryDays, int waitingPeriodVoluntaryDays,
        int pregnancyBenefitPeriodDays, int sickPayDays, int sickPayDaysAge50, Rate pregnancySicknessRate,
        Rate pregnancyRehabilitationRate, int rehabilitationMaxMonths, Rate incomeTaxAdvanceRate) {

    public SicknessParameters {
        Objects.requireNonNull(pregnancySicknessRate, "pregnancySicknessRate");
        Objects.requireNonNull(pregnancyRehabilitationRate, "pregnancyRehabilitationRate");
        Objects.requireNonNull(incomeTaxAdvanceRate, "incomeTaxAdvanceRate");
    }
}
