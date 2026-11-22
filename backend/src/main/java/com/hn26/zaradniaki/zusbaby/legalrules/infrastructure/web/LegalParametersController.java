package com.hn26.zaradniaki.zusbaby.legalrules.infrastructure.web;

import an.awesome.pipelinr.Pipeline;
import com.hn26.zaradniaki.zusbaby.api.LegalParametersApi;
import com.hn26.zaradniaki.zusbaby.api.model.LegalParametersResponseDto;
import com.hn26.zaradniaki.zusbaby.legalrules.application.query.GetCurrentLegalParametersQuery;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
class LegalParametersController implements LegalParametersApi {

    private final Pipeline pipeline;
    private final LegalParametersWebMapper mapper;

    @Override
    public ResponseEntity<LegalParametersResponseDto> getLegalParameters() {
        return ResponseEntity.ok(mapper.toResponse(pipeline.send(new GetCurrentLegalParametersQuery())));
    }
}
