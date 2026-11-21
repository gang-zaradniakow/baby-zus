package com.hn26.zaradniaki.zusbaby.benefits.application.handler;

import an.awesome.pipelinr.Command;
import an.awesome.pipelinr.Pipeline;
import com.hn26.zaradniaki.zusbaby.benefits.application.dto.BenefitBaseDto;
import com.hn26.zaradniaki.zusbaby.benefits.application.mapper.BenefitParametersMapper;
import com.hn26.zaradniaki.zusbaby.benefits.application.mapper.BenefitsDtoMapper;
import com.hn26.zaradniaki.zusbaby.benefits.application.query.CalculateBenefitBaseQuery;
import com.hn26.zaradniaki.zusbaby.benefits.domain.base.BenefitBaseCalculator;
import com.hn26.zaradniaki.zusbaby.legalrules.application.query.GetCurrentLegalParametersQuery;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
class CalculateBenefitBaseHandler implements Command.Handler<CalculateBenefitBaseQuery, BenefitBaseDto> {

    private final Pipeline pipeline;
    private final BenefitBaseCalculator calculator;
    private final BenefitParametersMapper parametersMapper;
    private final BenefitsDtoMapper mapper;

    @Override
    @Transactional(readOnly = true)
    public BenefitBaseDto handle(CalculateBenefitBaseQuery query) {
        var parameters = parametersMapper.toBenefitParameters(pipeline.send(new GetCurrentLegalParametersQuery()));
        return mapper.toDto(calculator.fromMonthlyPay(query.months(), query.title(), query.fullTime(), parameters));
    }
}
