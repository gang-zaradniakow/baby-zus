package com.hn26.zaradniaki.zusbaby.legalrules.application.dto;

import java.time.LocalDate;
import java.util.List;

/**
 * One version of the legal parameters (result of the legal parameter queries).
 * @param version version number; a new legal state means the next version
 * @param validFrom first day the version is in force
 * @param description legal basis of the values
 * @param parameters every parameter, in {@code ParameterKey} order
 */
public record LegalParametersDto(int version, LocalDate validFrom, String description, List<ParameterDto> parameters) {

    public LegalParametersDto {
        parameters = List.copyOf(parameters);
    }
}
