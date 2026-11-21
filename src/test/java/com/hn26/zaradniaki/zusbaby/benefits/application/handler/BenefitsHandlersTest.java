package com.hn26.zaradniaki.zusbaby.benefits.application.handler;

import static org.assertj.core.api.Assertions.assertThat;

import an.awesome.pipelinr.Command;
import an.awesome.pipelinr.Notification;
import an.awesome.pipelinr.Pipeline;
import com.hn26.zaradniaki.zusbaby.benefits.application.mapper.BenefitParametersMapper;
import com.hn26.zaradniaki.zusbaby.benefits.application.mapper.BenefitsDtoMapper;
import com.hn26.zaradniaki.zusbaby.benefits.application.query.CalculateBenefitBaseQuery;
import com.hn26.zaradniaki.zusbaby.benefits.application.query.ResolveInsuranceQuery;
import com.hn26.zaradniaki.zusbaby.benefits.domain.base.BenefitBaseCalculator;
import com.hn26.zaradniaki.zusbaby.benefits.domain.base.MonthlyPay;
import com.hn26.zaradniaki.zusbaby.benefits.domain.insurance.InsuranceTitle;
import com.hn26.zaradniaki.zusbaby.benefits.domain.insurance.InsuranceTitleResolver;
import com.hn26.zaradniaki.zusbaby.benefits.domain.insurance.InsuranceTitles;
import com.hn26.zaradniaki.zusbaby.legalrules.api.model.ParameterKey;
import com.hn26.zaradniaki.zusbaby.legalrules.application.dto.LegalParametersDto;
import com.hn26.zaradniaki.zusbaby.legalrules.application.dto.ParameterDto;
import com.hn26.zaradniaki.zusbaby.legalrules.application.query.GetCurrentLegalParametersQuery;
import com.hn26.zaradniaki.zusbaby.shared.domain.Money;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;

class BenefitsHandlersTest {

    /**
     * Answers the legal parameters query like the legalrules module, with a raised
     * minimum base.
     */
    private final Pipeline pipeline = new Pipeline() {
        @Override
        @SuppressWarnings("unchecked")
        public <R, C extends Command<R>> R send(C command) {
            assertThat(command).isInstanceOf(GetCurrentLegalParametersQuery.class);
            return (R) new LegalParametersDto(2, LocalDate.of(2027, 1, 1), "Stan prawny 2027",
                    Arrays.stream(new Object[][]{{ParameterKey.MINIMUM_WAGE, "5000"},
                            {ParameterKey.EMPLOYEE_CONTRIBUTION_RATE, "0.1371"},
                            {ParameterKey.MINIMUM_BENEFIT_BASE, "4314.50"},
                            {ParameterKey.MAXIMUM_VOLUNTARY_BENEFIT_BASE, "21000"},
                            {ParameterKey.DEBT_THRESHOLD, "50"}})
                            .map(row -> new ParameterDto((ParameterKey) row[0], ((ParameterKey) row[0]).kind(),
                                    ((ParameterKey) row[0]).label(), new BigDecimal((String) row[1]), null))
                            .toList());
        }

        @Override
        public <N extends Notification> void send(N notification) {
            throw new UnsupportedOperationException();
        }
    };

    private final BenefitsDtoMapper mapper = Mappers.getMapper(BenefitsDtoMapper.class);
    private final BenefitParametersMapper parametersMapper = new BenefitParametersMapper();

    @Test
    void resolvesInsuranceWithTheCurrentLegalParameters() {
        var handler = new ResolveInsuranceHandler(pipeline, new InsuranceTitleResolver(), parametersMapper, mapper);

        var result = handler.handle(new ResolveInsuranceQuery(
                new InsuranceTitles(new InsuranceTitles.Employment(Money.of(3000), true), null, null, false)));

        assertThat(result.mainTitle()).isEqualTo(InsuranceTitle.EMPLOYMENT);
        assertThat(result.base()).isEqualTo(Money.of("4314.50"));
        assertThat(result.checks().getFirst().message()).contains("4314,50 zł");
    }

    @Test
    void calculatesBenefitBaseWithTheCurrentLegalParameters() {
        var handler = new CalculateBenefitBaseHandler(pipeline, new BenefitBaseCalculator(), parametersMapper,
                mapper);

        var result = handler.handle(new CalculateBenefitBaseQuery(List.of(new MonthlyPay(Money.of(3000), false)),
                InsuranceTitle.EMPLOYMENT, true));

        assertThat(result.base()).isEqualTo(Money.of("4314.50"));
        assertThat(result.monthsCounted()).isEqualTo(1);
    }
}
