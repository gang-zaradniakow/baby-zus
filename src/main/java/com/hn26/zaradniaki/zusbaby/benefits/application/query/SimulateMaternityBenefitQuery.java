package com.hn26.zaradniaki.zusbaby.benefits.application.query;

import an.awesome.pipelinr.Command;
import com.hn26.zaradniaki.zusbaby.benefits.application.dto.MaternitySimulationDto;
import com.hn26.zaradniaki.zusbaby.benefits.domain.insurance.InsuranceTitles;
import com.hn26.zaradniaki.zusbaby.benefits.domain.leave.PretermBirth;
import com.hn26.zaradniaki.zusbaby.benefits.domain.leave.TakenInChild;
import com.hn26.zaradniaki.zusbaby.benefits.domain.maternity.BenefitVariant;
import com.hn26.zaradniaki.zusbaby.benefits.domain.maternity.CareSituation;
import com.hn26.zaradniaki.zusbaby.benefits.domain.maternity.FatherLeaveChoices;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

/**
 * Leave split between the parents and its timeline, from both parents'
 * insurance titles.
 */
public record SimulateMaternityBenefitQuery(@NotNull CareSituation situation, @NotNull LocalDate startDate,
        @Min(1) int children, boolean zaZyciem, @NotNull BenefitVariant variant, PretermBirth preterm,
        TakenInChild adoption, @NotNull InsuranceTitles mother, @NotNull InsuranceTitles father,
        @NotNull FatherLeaveChoices fatherChoices) implements Command<MaternitySimulationDto> {

    @AssertTrue(message = "przy przyjęciu dziecka podaj dane adopcji lub rodziny zastępczej")
    boolean isAdoptionGivenForTakenInChild() {
        return situation != CareSituation.ADOPTION || adoption != null;
    }

    @AssertTrue(message = "wcześniak i adopcja dotyczą różnych sytuacji")
    boolean isPretermOnlyForBirth() {
        return situation != CareSituation.ADOPTION || preterm == null;
    }
}
