package com.hn26.zaradniaki.zusbaby.benefits.application.mapper;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatIllegalStateException;

import com.hn26.zaradniaki.zusbaby.benefits.domain.BenefitParametersFixtures;
import com.hn26.zaradniaki.zusbaby.benefits.domain.LeaveParametersFixtures;
import com.hn26.zaradniaki.zusbaby.legalrules.api.model.ParameterKey;
import com.hn26.zaradniaki.zusbaby.legalrules.application.dto.LegalParametersDto;
import com.hn26.zaradniaki.zusbaby.legalrules.application.dto.ParameterDto;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;

class BenefitParametersMapperTest {

    private final BenefitParametersMapper mapper = new BenefitParametersMapper();

    @Test
    void takesTheValuesItNeedsFromLegalParameters() {
        var dto = legalParameters(List.of(parameter(ParameterKey.MINIMUM_WAGE, "4806"),
                parameter(ParameterKey.EMPLOYEE_CONTRIBUTION_RATE, "0.1371"),
                parameter(ParameterKey.MINIMUM_BENEFIT_BASE, "4147.1"),
                parameter(ParameterKey.MAXIMUM_VOLUNTARY_BENEFIT_BASE, "20321.3"),
                parameter(ParameterKey.DEBT_THRESHOLD, "48.06"), parameter(ParameterKey.FUNERAL_GRANT, "7000")));

        assertThat(mapper.toBenefitParameters(dto)).isEqualTo(BenefitParametersFixtures.legalState2026());
    }

    @Test
    void failsWhenAParameterIsMissing() {
        var dto = legalParameters(List.of(parameter(ParameterKey.MINIMUM_WAGE, "4806")));

        assertThatIllegalStateException().isThrownBy(() -> mapper.toBenefitParameters(dto))
                .withMessageContaining("EMPLOYEE_CONTRIBUTION_RATE");
    }

    @Test
    void takesLeaveDimensionsFromLegalParameters() {
        var dto = legalParameters(List.of(
                new ParameterDto(ParameterKey.MATERNITY_LEAVE_WEEKS, ParameterKey.MATERNITY_LEAVE_WEEKS.kind(), "",
                        null, List.of(new BigDecimal("20"), new BigDecimal("31"), new BigDecimal("33"),
                                new BigDecimal("35"), new BigDecimal("37"))),
                parameter(ParameterKey.PARENTAL_LEAVE_WEEKS_ONE_CHILD, "41"),
                parameter(ParameterKey.PARENTAL_LEAVE_WEEKS_MULTIPLE_CHILDREN, "43"),
                parameter(ParameterKey.PARENTAL_LEAVE_WEEKS_ZA_ZYCIEM_ONE_CHILD, "65"),
                parameter(ParameterKey.PARENTAL_LEAVE_WEEKS_ZA_ZYCIEM_MULTIPLE_CHILDREN, "67"),
                parameter(ParameterKey.ADOPTION_MINIMUM_WEEKS, "9"),
                parameter(ParameterKey.ADOPTION_PARENTAL_MINIMUM_WEEKS, "38"),
                parameter(ParameterKey.ADOPTION_PARENTAL_MINIMUM_WEEKS_ZA_ZYCIEM, "62"),
                parameter(ParameterKey.FOSTER_CHILD_AGE_LIMIT, "7"),
                parameter(ParameterKey.FOSTER_CHILD_AGE_LIMIT_DEFERRED_SCHOOL, "10"),
                parameter(ParameterKey.ADOPTED_CHILD_AGE_LIMIT, "14"),
                parameter(ParameterKey.SUPPLEMENTARY_LEAVE_MAX_WEEKS_EXTREME_PRETERM, "15"),
                parameter(ParameterKey.SUPPLEMENTARY_LEAVE_MAX_WEEKS, "8")));

        assertThat(mapper.toLeaveParameters(dto)).isEqualTo(LeaveParametersFixtures.legalState2026());
    }

    private static LegalParametersDto legalParameters(List<ParameterDto> parameters) {
        return new LegalParametersDto(1, LocalDate.of(2026, 1, 1), "Stan prawny 2026", parameters);
    }

    private static ParameterDto parameter(ParameterKey key, String value) {
        return new ParameterDto(key, key.kind(), key.label(), new BigDecimal(value), null);
    }
}
