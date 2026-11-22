package com.hn26.zaradniaki.zusbaby.benefits.domain.insurance;

import com.hn26.zaradniaki.zusbaby.shared.domain.Money;
import java.math.BigDecimal;

/** Insurance titles of a parent as written in the golden files. */
public record InsuranceTitlesInput(Employment employment, MandateContract mandateContract, SelfEmployment selfEmployment,
        boolean agriculturalInsurance) {

    public record Employment(BigDecimal base, boolean atLeastMinimumWage) {
    }

    public record MandateContract(BigDecimal base, boolean voluntarySickness, boolean student) {
    }

    public record SelfEmployment(BigDecimal base, boolean voluntarySickness, boolean startupRelief, BigDecimal debt) {
    }

    public InsuranceTitles toTitles() {
        return new InsuranceTitles(
                employment == null
                        ? null
                        : new InsuranceTitles.Employment(new Money(employment.base()), employment.atLeastMinimumWage()),
                mandateContract == null
                        ? null
                        : new InsuranceTitles.MandateContract(new Money(mandateContract.base()),
                                mandateContract.voluntarySickness(), mandateContract.student()),
                selfEmployment == null
                        ? null
                        : new InsuranceTitles.SelfEmployment(new Money(selfEmployment.base()),
                                selfEmployment.voluntarySickness(), selfEmployment.startupRelief(),
                                new Money(selfEmployment.debt())),
                agriculturalInsurance);
    }
}
