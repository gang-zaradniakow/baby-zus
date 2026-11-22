package com.hn26.zaradniaki.zusbaby.guide.infrastructure.web;

import an.awesome.pipelinr.Pipeline;
import com.hn26.zaradniaki.zusbaby.api.GuideApi;
import com.hn26.zaradniaki.zusbaby.api.model.GuidePreviewDto;
import com.hn26.zaradniaki.zusbaby.api.model.GuideSurveyDto;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
class GuideController implements GuideApi {

    private final Pipeline pipeline;
    private final GuideWebMapper mapper;

    @Override
    public ResponseEntity<GuidePreviewDto> previewGuide(GuideSurveyDto survey) {
        return ResponseEntity.ok(mapper.toResponse(pipeline.send(mapper.toQuery(survey))));
    }
}
