package com.hn26.zaradniaki.zusbaby.legalrules.application.query;

import an.awesome.pipelinr.Command;
import com.hn26.zaradniaki.zusbaby.legalrules.application.dto.LegalParametersDto;

/** Legal parameters in force today. */
public record GetCurrentLegalParametersQuery() implements Command<LegalParametersDto> {
}
