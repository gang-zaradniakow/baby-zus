package com.hn26.zaradniaki.zusbaby.benefits.application.query;

import an.awesome.pipelinr.Command;
import com.hn26.zaradniaki.zusbaby.benefits.api.model.PretermBirth;
import com.hn26.zaradniaki.zusbaby.benefits.api.model.TakenInChild;
import com.hn26.zaradniaki.zusbaby.benefits.application.dto.MaternitySimulationDto;
import com.hn26.zaradniaki.zusbaby.benefits.domain.insurance.InsuranceTitles;
import com.hn26.zaradniaki.zusbaby.benefits.domain.maternity.BenefitVariant;
import com.hn26.zaradniaki.zusbaby.benefits.domain.maternity.CareSituation;
import com.hn26.zaradniaki.zusbaby.benefits.domain.maternity.FatherLeaveChoices;
import com.hn26.zaradniaki.zusbaby.benefits.domain.maternity.PartTimeWork;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

/**
 * Leave split between the parents, its timeline and amounts, from both parents'
 * insurance titles; optionally with parental leave combined with part-time
 * work.
 */
public record SimulateMaternityBenefitQuery(@NotNull CareSituation situation, @NotNull LocalDate startDate,
        @Min(1) int children, boolean zaZyciem, @NotNull BenefitVariant variant, PretermBirth preterm,
        TakenInChild adoption, @NotNull InsuranceTitles mother, @NotNull InsuranceTitles father,
        @NotNull FatherLeaveChoices fatherChoices, PartTimeWork work) implements Command<MaternitySimulationDto> {

    @AssertTrue(message = "przy przyjęciu dziecka podaj dane adopcji lub rodziny zastępczej")
    boolean isAdoptionGivenForTakenInChild() {
        return situation != CareSituation.ADOPTION || adoption != null;
    }

    @AssertTrue(message = "wcześniak i adopcja dotyczą różnych sytuacji")
    boolean isPretermOnlyForBirth() {
        return situation != CareSituation.ADOPTION || preterm == null;
    }
}
