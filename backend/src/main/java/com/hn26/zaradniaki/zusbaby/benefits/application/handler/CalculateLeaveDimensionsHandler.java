package com.hn26.zaradniaki.zusbaby.benefits.application.handler;

import an.awesome.pipelinr.Command;
import an.awesome.pipelinr.Pipeline;
import com.hn26.zaradniaki.zusbaby.benefits.application.dto.LeaveDimensionsDto;
import com.hn26.zaradniaki.zusbaby.benefits.application.mapper.BenefitParametersMapper;
import com.hn26.zaradniaki.zusbaby.benefits.application.mapper.BenefitsDtoMapper;
import com.hn26.zaradniaki.zusbaby.benefits.application.query.CalculateLeaveDimensionsQuery;
import com.hn26.zaradniaki.zusbaby.benefits.domain.LeaveParameters;
import com.hn26.zaradniaki.zusbaby.benefits.domain.leave.AdoptionLeave;
import com.hn26.zaradniaki.zusbaby.benefits.domain.leave.AdoptionLeavePolicy;
import com.hn26.zaradniaki.zusbaby.benefits.domain.leave.LeaveDimensionsPolicy;
import com.hn26.zaradniaki.zusbaby.benefits.domain.leave.SupplementaryLeavePolicy;
import com.hn26.zaradniaki.zusbaby.legalrules.application.query.GetCurrentLegalParametersQuery;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
class CalculateLeaveDimensionsHandler implements Command.Handler<CalculateLeaveDimensionsQuery, LeaveDimensionsDto> {

    private final Pipeline pipeline;
    private final LeaveDimensionsPolicy dimensions;
    private final AdoptionLeavePolicy adoptionPolicy;
    private final SupplementaryLeavePolicy supplementaryPolicy;
    private final BenefitParametersMapper parametersMapper;
    private final BenefitsDtoMapper mapper;

    @Override
    @Transactional(readOnly = true)
    public LeaveDimensionsDto handle(CalculateLeaveDimensionsQuery query) {
        LeaveParameters parameters = parametersMapper
                .toLeaveParameters(pipeline.send(new GetCurrentLegalParametersQuery()));
        if (query.adoption() != null) {
            AdoptionLeave leave = adoptionPolicy.leave(query.children(), query.zaZyciem(), query.adoption(),
                    parameters);
            return new LeaveDimensionsDto(leave.maternityWeeks(), leave.parentalWeeks(), mapper.toDto(leave), null);
        }
        return new LeaveDimensionsDto(dimensions.maternityWeeks(query.children(), parameters),
                dimensions.parentalWeeks(query.children(), query.zaZyciem(), parameters), null,
                query.preterm() == null ? null : mapper.toDto(supplementaryPolicy.leave(query.preterm(), parameters)));
    }
}
