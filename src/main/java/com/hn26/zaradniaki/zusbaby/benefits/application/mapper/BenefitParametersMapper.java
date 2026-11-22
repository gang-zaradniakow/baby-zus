package com.hn26.zaradniaki.zusbaby.benefits.application.mapper;

import com.hn26.zaradniaki.zusbaby.benefits.domain.BenefitParameters;
import com.hn26.zaradniaki.zusbaby.benefits.domain.LeaveParameters;
import com.hn26.zaradniaki.zusbaby.legalrules.api.model.ParameterKey;
import com.hn26.zaradniaki.zusbaby.legalrules.application.dto.LegalParametersDto;
import com.hn26.zaradniaki.zusbaby.legalrules.application.dto.ParameterDto;
import com.hn26.zaradniaki.zusbaby.shared.domain.Money;
import com.hn26.zaradniaki.zusbaby.shared.domain.Rate;
import com.hn26.zaradniaki.zusbaby.shared.domain.Weeks;
import java.math.BigDecimal;
import java.util.List;
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

    public LeaveParameters toLeaveParameters(LegalParametersDto parameters) {
        return new LeaveParameters(
                parameter(parameters, ParameterKey.MATERNITY_LEAVE_WEEKS).values().stream().map(Weeks::new).toList(),
                weeks(parameters, ParameterKey.PARENTAL_LEAVE_WEEKS_ONE_CHILD),
                weeks(parameters, ParameterKey.PARENTAL_LEAVE_WEEKS_MULTIPLE_CHILDREN),
                weeks(parameters, ParameterKey.PARENTAL_LEAVE_WEEKS_ZA_ZYCIEM_ONE_CHILD),
                weeks(parameters, ParameterKey.PARENTAL_LEAVE_WEEKS_ZA_ZYCIEM_MULTIPLE_CHILDREN),
                weeks(parameters, ParameterKey.ADOPTION_MINIMUM_WEEKS),
                weeks(parameters, ParameterKey.ADOPTION_PARENTAL_MINIMUM_WEEKS),
                weeks(parameters, ParameterKey.ADOPTION_PARENTAL_MINIMUM_WEEKS_ZA_ZYCIEM),
                value(parameters, ParameterKey.FOSTER_CHILD_AGE_LIMIT).intValueExact(),
                value(parameters, ParameterKey.FOSTER_CHILD_AGE_LIMIT_DEFERRED_SCHOOL).intValueExact(),
                value(parameters, ParameterKey.ADOPTED_CHILD_AGE_LIMIT).intValueExact(),
                weeks(parameters, ParameterKey.SUPPLEMENTARY_LEAVE_MAX_WEEKS_EXTREME_PRETERM),
                weeks(parameters, ParameterKey.SUPPLEMENTARY_LEAVE_MAX_WEEKS));
    }

    private static Weeks weeks(LegalParametersDto parameters, ParameterKey key) {
        return new Weeks(value(parameters, key));
    }

    private static BigDecimal value(LegalParametersDto parameters, ParameterKey key) {
        return parameter(parameters, key).value();
    }

    private static ParameterDto parameter(LegalParametersDto parameters, ParameterKey key) {
        List<ParameterDto> all = parameters.parameters();
        return all.stream().filter(parameter -> parameter.key() == key).findFirst()
                .orElseThrow(() -> new IllegalStateException("Missing legal parameter " + key));
    }
}
