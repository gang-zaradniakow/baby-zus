package com.hn26.zaradniaki.zusbaby.guide.application.mapper;

import com.hn26.zaradniaki.zusbaby.guide.domain.GuideParameters;
import com.hn26.zaradniaki.zusbaby.legalrules.api.model.ParameterKey;
import com.hn26.zaradniaki.zusbaby.legalrules.application.dto.LegalParametersDto;
import com.hn26.zaradniaki.zusbaby.legalrules.application.dto.ParameterDto;
import com.hn26.zaradniaki.zusbaby.shared.domain.Rate;
import com.hn26.zaradniaki.zusbaby.shared.domain.Weeks;
import org.springframework.stereotype.Component;

/**
 * Translates the published legal parameters of the legalrules module into this
 * module's own model.
 */
@Component
public class GuideParametersMapper {

    public GuideParameters toGuideParameters(LegalParametersDto parameters) {
        return new GuideParameters(
                parameter(parameters, ParameterKey.MATERNITY_LEAVE_WEEKS).values().stream().map(Weeks::new).toList(),
                rate(parameters, ParameterKey.MATERNITY_LEAVE_RATE),
                rate(parameters, ParameterKey.SUPPLEMENTARY_LEAVE_RATE),
                rate(parameters, ParameterKey.PARENTAL_LEAVE_RATE));
    }

    private static Rate rate(LegalParametersDto parameters, ParameterKey key) {
        return new Rate(parameter(parameters, key).value());
    }

    private static ParameterDto parameter(LegalParametersDto parameters, ParameterKey key) {
        return parameters.parameters().stream().filter(parameter -> parameter.key() == key).findFirst()
                .orElseThrow(() -> new IllegalStateException("Missing legal parameter " + key));
    }
}
