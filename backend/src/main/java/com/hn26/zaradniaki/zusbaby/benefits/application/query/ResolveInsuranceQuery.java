package com.hn26.zaradniaki.zusbaby.benefits.application.query;

import an.awesome.pipelinr.Command;
import com.hn26.zaradniaki.zusbaby.benefits.application.dto.InsuranceResolutionDto;
import com.hn26.zaradniaki.zusbaby.benefits.domain.insurance.InsuranceTitles;
import jakarta.validation.constraints.NotNull;

/**
 * Which insurance titles of one person give a benefit, with what base and why.
 */
public record ResolveInsuranceQuery(@NotNull InsuranceTitles titles) implements Command<InsuranceResolutionDto> {
}
