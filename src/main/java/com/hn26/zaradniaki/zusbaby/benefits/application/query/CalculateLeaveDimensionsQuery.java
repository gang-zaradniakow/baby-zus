package com.hn26.zaradniaki.zusbaby.benefits.application.query;

import an.awesome.pipelinr.Command;
import com.hn26.zaradniaki.zusbaby.benefits.application.dto.LeaveDimensionsDto;
import com.hn26.zaradniaki.zusbaby.benefits.domain.leave.PretermBirth;
import com.hn26.zaradniaki.zusbaby.benefits.domain.leave.TakenInChild;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Min;

/**
 * Leave lengths after birth or taking in a child. {@code adoption} applies to a
 * child taken in, {@code preterm} to a premature or hospitalised newborn; both
 * are optional and exclude each other.
 */
public record CalculateLeaveDimensionsQuery(@Min(1) int children, boolean zaZyciem, TakenInChild adoption,
        PretermBirth preterm) implements Command<LeaveDimensionsDto> {

    @AssertTrue(message = "urlop uzupełniający dotyczy porodu, nie przyjęcia dziecka")
    boolean isNotAdoptionAndPreterm() {
        return adoption == null || preterm == null;
    }
}
