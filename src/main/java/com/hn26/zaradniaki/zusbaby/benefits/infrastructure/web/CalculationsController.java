package com.hn26.zaradniaki.zusbaby.benefits.infrastructure.web;

import an.awesome.pipelinr.Pipeline;
import com.hn26.zaradniaki.zusbaby.api.CalculationsApi;
import com.hn26.zaradniaki.zusbaby.api.model.BenefitBaseDto;
import com.hn26.zaradniaki.zusbaby.api.model.BenefitBaseRequestDto;
import com.hn26.zaradniaki.zusbaby.api.model.InsuranceResolutionDto;
import com.hn26.zaradniaki.zusbaby.api.model.InsuranceTitlesRequestDto;
import com.hn26.zaradniaki.zusbaby.benefits.application.query.ResolveInsuranceQuery;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
class CalculationsController implements CalculationsApi {

    private final Pipeline pipeline;
    private final CalculationsWebMapper mapper;

    @Override
    public ResponseEntity<InsuranceResolutionDto> resolveInsurance(InsuranceTitlesRequestDto request) {
        return ResponseEntity
                .ok(mapper.toResponse(pipeline.send(new ResolveInsuranceQuery(mapper.toTitles(request)))));
    }

    @Override
    public ResponseEntity<BenefitBaseDto> calculateBenefitBase(BenefitBaseRequestDto request) {
        return ResponseEntity.ok(mapper.toResponse(pipeline.send(mapper.toQuery(request))));
    }
}
