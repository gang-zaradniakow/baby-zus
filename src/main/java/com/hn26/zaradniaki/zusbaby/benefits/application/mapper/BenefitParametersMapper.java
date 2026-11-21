package com.hn26.zaradniaki.zusbaby.benefits.application.mapper;

import com.hn26.zaradniaki.zusbaby.benefits.domain.BenefitParameters;
import com.hn26.zaradniaki.zusbaby.legalrules.api.model.ParameterKey;
import com.hn26.zaradniaki.zusbaby.legalrules.application.dto.LegalParametersDto;
import com.hn26.zaradniaki.zusbaby.legalrules.application.dto.ParameterDto;
import com.hn26.zaradniaki.zusbaby.shared.domain.Money;
import com.hn26.zaradniaki.zusbaby.shared.domain.Rate;
import java.math.BigDecimal;
import org.springframework.stereotype.Component;

/**
 * Translates the published legal parameters of the legalrules module into this
 * module's own model.
 */
@Component
public class BenefitParametersMapper {

    public BenefitParameters toBenefitParameters(LegalParametersDto parameters) {
        return new BenefitParameters(new Money(value(parameters, ParameterKey.MINIMUM_WAGE)),
                new Rate(value(parameters, ParameterKey.EMPLOYEE_CONTRIBUTION_RATE)),
                new Money(value(parameters, ParameterKey.MINIMUM_BENEFIT_BASE)),
                new Money(value(parameters, ParameterKey.MAXIMUM_VOLUNTARY_BENEFIT_BASE)),
                new Money(value(parameters, ParameterKey.DEBT_THRESHOLD)));
    }

    private static BigDecimal value(LegalParametersDto parameters, ParameterKey key) {
        return parameters.parameters().stream().filter(parameter -> parameter.key() == key).map(ParameterDto::value)
                .findFirst().orElseThrow(() -> new IllegalStateException("Missing legal parameter " + key));
    }
}
