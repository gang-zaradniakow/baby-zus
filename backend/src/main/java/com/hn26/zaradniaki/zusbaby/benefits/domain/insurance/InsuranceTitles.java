package com.hn26.zaradniaki.zusbaby.benefits.domain.insurance;

import com.hn26.zaradniaki.zusbaby.shared.domain.Money;
import java.util.Objects;

/**
 * Insurance titles of one person. A {@code null} title means the person does
 * not have it.
 * @param employment employment contract
 * @param mandateContract mandate contract (umowa zlecenia)
 * @param selfEmployment own business (JDG)
 * @param agriculturalInsurance insured as a farmer in KRUS
 */
public record InsuranceTitles(Employment employment, MandateContract mandateContract, SelfEmployment selfEmployment,
        boolean agriculturalInsurance) {

    public boolean hasAnyZusTitle() {
        return employment != null || mandateContract != null || selfEmployment != null;
    }

    /**
     * @param base benefit base (after contributions)
     * @param atLeastMinimumWage pay at least the minimum wage: other titles then
     *            give no sickness insurance
     */
    public record Employment(Money base, boolean atLeastMinimumWage) {

        public Employment {
            Objects.requireNonNull(base, "base");
        }
    }

    /**
     * @param base benefit base (after contributions)
     * @param voluntarySickness joined voluntary sickness insurance
     * @param student student or pupil under 26: not insured on a mandate contract
     */
    public record MandateContract(Money base, boolean voluntarySickness, boolean student) {

        public MandateContract {
            Objects.requireNonNull(base, "base");
        }
    }

    /**
     * @param base contribution base minus contributions
     * @param voluntarySickness joined voluntary sickness insurance
     * @param startupRelief first 6 months on startup relief: no social insurance
     * @param debt contribution debt on the day the right arises
     */
    public record SelfEmployment(Money base, boolean voluntarySickness, boolean startupRelief, Money debt) {

        public SelfEmployment {
            Objects.requireNonNull(base, "base");
            debt = debt == null ? Money.ZERO : debt;
        }
    }
}
