package com.hn26.zaradniaki.zusbaby.knowledge.infrastructure.web;

import an.awesome.pipelinr.Pipeline;
import com.hn26.zaradniaki.zusbaby.api.ContentApi;
import com.hn26.zaradniaki.zusbaby.api.model.ContentFactsDto;
import com.hn26.zaradniaki.zusbaby.api.model.ContentFormsDto;
import com.hn26.zaradniaki.zusbaby.api.model.ContentWeekCardsDto;
import com.hn26.zaradniaki.zusbaby.api.model.SupportContactsDto;
import com.hn26.zaradniaki.zusbaby.knowledge.application.query.GetFactsQuery;
import com.hn26.zaradniaki.zusbaby.knowledge.application.query.GetFormsQuery;
import com.hn26.zaradniaki.zusbaby.knowledge.application.query.GetSupportContactsQuery;
import com.hn26.zaradniaki.zusbaby.knowledge.application.query.GetWeekCardsQuery;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
class ContentController implements ContentApi {

    private final Pipeline pipeline;
    private final ContentWebMapper mapper;

    @Override
    public ResponseEntity<ContentFormsDto> getForms() {
        return ResponseEntity.ok(new ContentFormsDto(mapper.toForms(pipeline.send(new GetFormsQuery()))));
    }

    @Override
    public ResponseEntity<ContentFactsDto> getFacts() {
        return ResponseEntity.ok(new ContentFactsDto(pipeline.send(new GetFactsQuery())));
    }

    @Override
    public ResponseEntity<SupportContactsDto> getSupportContacts() {
        return ResponseEntity.ok(mapper.toResponse(pipeline.send(new GetSupportContactsQuery())));
    }

    @Override
    public ResponseEntity<ContentWeekCardsDto> getWeekCards() {
        return ResponseEntity.ok(mapper.toResponse(pipeline.send(new GetWeekCardsQuery())));
    }
}
