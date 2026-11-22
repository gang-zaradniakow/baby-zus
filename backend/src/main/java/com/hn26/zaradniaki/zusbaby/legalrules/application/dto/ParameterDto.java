package com.hn26.zaradniaki.zusbaby.legalrules.application.dto;

import com.hn26.zaradniaki.zusbaby.legalrules.api.model.ParameterKey;
import com.hn26.zaradniaki.zusbaby.legalrules.api.model.ParameterKind;
import java.math.BigDecimal;
import java.util.List;

/**
 * One legal parameter. Single-valued kinds carry {@code value};
 * {@code WEEKS_BY_CHILDREN} carries {@code values} (for 1, 2, 3, 4 and 5 or
 * more children); the other field is {@code null}.
 */
public record ParameterDto(ParameterKey key, ParameterKind kind, String label, BigDecimal value,
        List<BigDecimal> values) {
}
