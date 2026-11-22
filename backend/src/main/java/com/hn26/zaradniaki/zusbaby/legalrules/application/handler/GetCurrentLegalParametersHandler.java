package com.hn26.zaradniaki.zusbaby.legalrules.application.handler;

import an.awesome.pipelinr.Command;
import com.hn26.zaradniaki.zusbaby.legalrules.api.exception.LegalParametersNotFoundException;
import com.hn26.zaradniaki.zusbaby.legalrules.application.dto.LegalParametersDto;
import com.hn26.zaradniaki.zusbaby.legalrules.application.mapper.LegalParametersDtoMapper;
import com.hn26.zaradniaki.zusbaby.legalrules.application.query.GetCurrentLegalParametersQuery;
import com.hn26.zaradniaki.zusbaby.legalrules.domain.ParameterSetRepository;
import com.hn26.zaradniaki.zusbaby.shared.time.DateTimeGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
class GetCurrentLegalParametersHandler implements Command.Handler<GetCurrentLegalParametersQuery, LegalParametersDto> {

    private final ParameterSetRepository repository;
    private final LegalParametersDtoMapper mapper;
    private final DateTimeGenerator dateTimeGenerator;

    @Override
    @Transactional(readOnly = true)
    public LegalParametersDto handle(GetCurrentLegalParametersQuery query) {
        return repository.findEffectiveOn(dateTimeGenerator.today()).map(mapper::toDto)
                .orElseThrow(LegalParametersNotFoundException::new);
    }
}
