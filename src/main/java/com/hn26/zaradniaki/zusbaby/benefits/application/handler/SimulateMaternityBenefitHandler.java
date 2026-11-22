package com.hn26.zaradniaki.zusbaby.benefits.application.handler;

import an.awesome.pipelinr.Command;
import an.awesome.pipelinr.Pipeline;
import com.hn26.zaradniaki.zusbaby.benefits.application.dto.MaternitySimulationDto;
import com.hn26.zaradniaki.zusbaby.benefits.application.mapper.BenefitParametersMapper;
import com.hn26.zaradniaki.zusbaby.benefits.application.mapper.BenefitsDtoMapper;
import com.hn26.zaradniaki.zusbaby.benefits.application.query.SimulateMaternityBenefitQuery;
import com.hn26.zaradniaki.zusbaby.benefits.domain.BenefitParameters;
import com.hn26.zaradniaki.zusbaby.benefits.domain.insurance.InsuranceTitleResolver;
import com.hn26.zaradniaki.zusbaby.benefits.domain.maternity.MaternityBenefitCalculator;
import com.hn26.zaradniaki.zusbaby.benefits.domain.maternity.MaternityCase;
import com.hn26.zaradniaki.zusbaby.legalrules.application.dto.LegalParametersDto;
import com.hn26.zaradniaki.zusbaby.legalrules.application.query.GetCurrentLegalParametersQuery;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
class SimulateMaternityBenefitHandler implements Command.Handler<SimulateMaternityBenefitQuery, MaternitySimulationDto> {

    private final Pipeline pipeline;
    private final InsuranceTitleResolver resolver;
    private final MaternityBenefitCalculator calculator;
    private final BenefitParametersMapper parametersMapper;
    private final BenefitsDtoMapper mapper;

    @Override
    @Transactional(readOnly = true)
    public MaternitySimulationDto handle(SimulateMaternityBenefitQuery query) {
        LegalParametersDto legalParameters = pipeline.send(new GetCurrentLegalParametersQuery());
        BenefitParameters benefitParameters = parametersMapper.toBenefitParameters(legalParameters);
        MaternityCase family = new MaternityCase(query.situation(), query.startDate(), query.children(),
                query.zaZyciem(), query.variant(), query.preterm(), query.adoption(),
                resolver.resolve(query.mother(), benefitParameters), resolver.resolve(query.father(), benefitParameters),
                query.fatherChoices(), query.work());
        return mapper.toDto(calculator.calculate(family, parametersMapper.toMaternityParameters(legalParameters),
                parametersMapper.toLeaveParameters(legalParameters)));
    }
}
