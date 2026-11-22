package com.hn26.zaradniaki.zusbaby.benefits.application.handler;

import an.awesome.pipelinr.Command;
import an.awesome.pipelinr.Pipeline;
import com.hn26.zaradniaki.zusbaby.benefits.application.dto.PregnancySicknessDto;
import com.hn26.zaradniaki.zusbaby.benefits.application.mapper.BenefitParametersMapper;
import com.hn26.zaradniaki.zusbaby.benefits.application.mapper.BenefitsDtoMapper;
import com.hn26.zaradniaki.zusbaby.benefits.application.query.CalculatePregnancySicknessQuery;
import com.hn26.zaradniaki.zusbaby.benefits.domain.insurance.InsuranceTitleResolver;
import com.hn26.zaradniaki.zusbaby.benefits.domain.insurance.ResolvedInsurance;
import com.hn26.zaradniaki.zusbaby.benefits.domain.sickness.PregnancySicknessCalculator;
import com.hn26.zaradniaki.zusbaby.legalrules.application.dto.LegalParametersDto;
import com.hn26.zaradniaki.zusbaby.legalrules.application.query.GetCurrentLegalParametersQuery;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
class CalculatePregnancySicknessHandler
        implements
            Command.Handler<CalculatePregnancySicknessQuery, PregnancySicknessDto> {

    private final Pipeline pipeline;
    private final InsuranceTitleResolver resolver;
    private final PregnancySicknessCalculator calculator;
    private final BenefitParametersMapper parametersMapper;
    private final BenefitsDtoMapper mapper;

    @Override
    @Transactional(readOnly = true)
    public PregnancySicknessDto handle(CalculatePregnancySicknessQuery query) {
        LegalParametersDto legalParameters = pipeline.send(new GetCurrentLegalParametersQuery());
        ResolvedInsurance insurance = resolver.resolve(query.titles(),
                parametersMapper.toBenefitParameters(legalParameters));
        return mapper.toDto(calculator.calculate(insurance, query.leave(),
                parametersMapper.toSicknessParameters(legalParameters)));
    }
}
