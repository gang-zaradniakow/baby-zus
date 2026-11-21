package com.hn26.zaradniaki.zusbaby.benefits.application.mapper;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatIllegalStateException;

import com.hn26.zaradniaki.zusbaby.benefits.domain.BenefitParametersFixtures;
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

    private static LegalParametersDto legalParameters(List<ParameterDto> parameters) {
        return new LegalParametersDto(1, LocalDate.of(2026, 1, 1), "Stan prawny 2026", parameters);
    }

    private static ParameterDto parameter(ParameterKey key, String value) {
        return new ParameterDto(key, key.kind(), key.label(), new BigDecimal(value), null);
    }
}
