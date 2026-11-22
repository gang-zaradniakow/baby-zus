package com.hn26.zaradniaki.zusbaby.benefits.application.mapper;

import com.hn26.zaradniaki.zusbaby.benefits.domain.BenefitParameters;
import com.hn26.zaradniaki.zusbaby.benefits.domain.LeaveParameters;
import com.hn26.zaradniaki.zusbaby.benefits.domain.MaternityParameters;
import com.hn26.zaradniaki.zusbaby.benefits.domain.SicknessParameters;
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

    public SicknessParameters toSicknessParameters(LegalParametersDto parameters) {
        return new SicknessParameters(whole(parameters, ParameterKey.WAITING_PERIOD_MANDATORY_DAYS),
                whole(parameters, ParameterKey.WAITING_PERIOD_VOLUNTARY_DAYS),
                whole(parameters, ParameterKey.PREGNANCY_BENEFIT_PERIOD_DAYS),
                whole(parameters, ParameterKey.SICK_PAY_DAYS), whole(parameters, ParameterKey.SICK_PAY_DAYS_AGE_50),
                new Rate(value(parameters, ParameterKey.PREGNANCY_SICKNESS_RATE)),
                new Rate(value(parameters, ParameterKey.PREGNANCY_REHABILITATION_RATE)),
                whole(parameters, ParameterKey.REHABILITATION_MAX_MONTHS),
                new Rate(value(parameters, ParameterKey.INCOME_TAX_ADVANCE_RATE)));
    }

    public MaternityParameters toMaternityParameters(LegalParametersDto parameters) {
        return new MaternityParameters(rate(parameters, ParameterKey.MATERNITY_LEAVE_RATE),
                rate(parameters, ParameterKey.PARENTAL_LEAVE_RATE), rate(parameters, ParameterKey.AVERAGED_RATE),
                rate(parameters, ParameterKey.SUPPLEMENTARY_LEAVE_RATE),
                rate(parameters, ParameterKey.PATERNITY_LEAVE_RATE),
                weeks(parameters, ParameterKey.NON_TRANSFERABLE_PARENTAL_WEEKS),
                weeks(parameters, ParameterKey.PATERNITY_LEAVE_WEEKS),
                weeks(parameters, ParameterKey.MOTHER_ONLY_MATERNITY_WEEKS),
                new Money(value(parameters, ParameterKey.DEBT_THRESHOLD)),
                weeks(parameters, ParameterKey.PARENTAL_LEAVE_WITH_WORK_MAX_WEEKS_ONE_CHILD),
                weeks(parameters, ParameterKey.PARENTAL_LEAVE_WITH_WORK_MAX_WEEKS_MULTIPLE_CHILDREN),
                weeks(parameters, ParameterKey.PARENTAL_LEAVE_WITH_WORK_MAX_WEEKS_ZA_ZYCIEM_ONE_CHILD),
                weeks(parameters, ParameterKey.PARENTAL_LEAVE_WITH_WORK_MAX_WEEKS_ZA_ZYCIEM_MULTIPLE_CHILDREN),
                new Money(value(parameters, ParameterKey.MINIMUM_MATERNITY_BENEFIT)),
                rate(parameters, ParameterKey.INCOME_TAX_ADVANCE_RATE),
                parameter(parameters, ParameterKey.PARENTAL_ALLOWANCE_WEEKS).values().stream().map(Weeks::new)
                        .toList());
    }

    private static Rate rate(LegalParametersDto parameters, ParameterKey key) {
        return new Rate(value(parameters, key));
    }

    private static int whole(LegalParametersDto parameters, ParameterKey key) {
        return value(parameters, key).intValueExact();
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
