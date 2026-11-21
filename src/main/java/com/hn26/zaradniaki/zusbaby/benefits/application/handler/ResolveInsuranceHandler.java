package com.hn26.zaradniaki.zusbaby.benefits.application.handler;

import an.awesome.pipelinr.Command;
import an.awesome.pipelinr.Pipeline;
import com.hn26.zaradniaki.zusbaby.benefits.application.dto.InsuranceResolutionDto;
import com.hn26.zaradniaki.zusbaby.benefits.application.mapper.BenefitParametersMapper;
import com.hn26.zaradniaki.zusbaby.benefits.application.mapper.BenefitsDtoMapper;
import com.hn26.zaradniaki.zusbaby.benefits.application.query.ResolveInsuranceQuery;
import com.hn26.zaradniaki.zusbaby.benefits.domain.insurance.InsuranceTitleResolver;
import com.hn26.zaradniaki.zusbaby.legalrules.application.query.GetCurrentLegalParametersQuery;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
class ResolveInsuranceHandler implements Command.Handler<ResolveInsuranceQuery, InsuranceResolutionDto> {

    private final Pipeline pipeline;
    private final InsuranceTitleResolver resolver;
    private final BenefitParametersMapper parametersMapper;
    private final BenefitsDtoMapper mapper;

    @Override
    @Transactional(readOnly = true)
    public InsuranceResolutionDto handle(ResolveInsuranceQuery query) {
        var parameters = parametersMapper.toBenefitParameters(pipeline.send(new GetCurrentLegalParametersQuery()));
        return mapper.toDto(resolver.resolve(query.titles(), parameters));
    }
}
