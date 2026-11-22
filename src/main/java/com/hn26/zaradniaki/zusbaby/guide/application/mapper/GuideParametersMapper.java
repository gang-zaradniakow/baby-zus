package com.hn26.zaradniaki.zusbaby.guide.application.mapper;

import com.hn26.zaradniaki.zusbaby.guide.domain.GuideParameters;
import com.hn26.zaradniaki.zusbaby.legalrules.api.model.ParameterKey;
import com.hn26.zaradniaki.zusbaby.legalrules.application.dto.LegalParametersDto;
import com.hn26.zaradniaki.zusbaby.shared.domain.Weeks;
import org.springframework.stereotype.Component;

/**
 * Translates the published legal parameters of the legalrules module into this
 * module's own model.
 */
@Component
public class GuideParametersMapper {

    public GuideParameters toGuideParameters(LegalParametersDto parameters) {
        return new GuideParameters(parameters.parameters().stream()
                .filter(parameter -> parameter.key() == ParameterKey.MATERNITY_LEAVE_WEEKS).findFirst()
                .orElseThrow(() -> new IllegalStateException(
                        "Missing legal parameter " + ParameterKey.MATERNITY_LEAVE_WEEKS))
                .values().stream().map(Weeks::new).toList());
    }
}
