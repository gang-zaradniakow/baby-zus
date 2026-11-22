package com.hn26.zaradniaki.zusbaby.legalrules.application.handler;

import an.awesome.pipelinr.Command;
import com.hn26.zaradniaki.zusbaby.legalrules.api.exception.LegalParametersNotFoundException;
import com.hn26.zaradniaki.zusbaby.legalrules.application.dto.LegalParametersDto;
import com.hn26.zaradniaki.zusbaby.legalrules.application.mapper.LegalParametersDtoMapper;
import com.hn26.zaradniaki.zusbaby.legalrules.application.query.GetLegalParametersEffectiveOnQuery;
import com.hn26.zaradniaki.zusbaby.legalrules.domain.ParameterSetRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
class GetLegalParametersEffectiveOnHandler
        implements
            Command.Handler<GetLegalParametersEffectiveOnQuery, LegalParametersDto> {

    private final ParameterSetRepository repository;
    private final LegalParametersDtoMapper mapper;

    @Override
    @Transactional(readOnly = true)
    public LegalParametersDto handle(GetLegalParametersEffectiveOnQuery query) {
        return repository.findEffectiveOn(query.day()).map(mapper::toDto)
                .orElseThrow(LegalParametersNotFoundException::new);
    }
}
