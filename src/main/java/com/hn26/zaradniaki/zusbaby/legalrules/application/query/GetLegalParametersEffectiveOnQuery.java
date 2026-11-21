package com.hn26.zaradniaki.zusbaby.legalrules.application.query;

import an.awesome.pipelinr.Command;
import com.hn26.zaradniaki.zusbaby.legalrules.application.dto.LegalParametersDto;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

/**
 * Legal parameters in force on a given day, e.g. the day of birth for a benefit
 * calculation.
 */
public record GetLegalParametersEffectiveOnQuery(@NotNull LocalDate day) implements Command<LegalParametersDto> {
}
