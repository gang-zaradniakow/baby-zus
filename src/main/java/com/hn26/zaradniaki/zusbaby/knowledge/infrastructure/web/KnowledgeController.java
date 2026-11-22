package com.hn26.zaradniaki.zusbaby.knowledge.infrastructure.web;

import an.awesome.pipelinr.Pipeline;
import com.hn26.zaradniaki.zusbaby.api.KnowledgeApi;
import com.hn26.zaradniaki.zusbaby.api.model.KnowledgeArticleDto;
import com.hn26.zaradniaki.zusbaby.api.model.KnowledgeChaptersDto;
import com.hn26.zaradniaki.zusbaby.api.model.KnowledgeSearchResultDto;
import com.hn26.zaradniaki.zusbaby.knowledge.application.query.GetKnowledgeArticleQuery;
import com.hn26.zaradniaki.zusbaby.knowledge.application.query.GetKnowledgeChaptersQuery;
import com.hn26.zaradniaki.zusbaby.knowledge.application.query.SearchKnowledgeQuery;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
class KnowledgeController implements KnowledgeApi {

    private final Pipeline pipeline;
    private final KnowledgeWebMapper mapper;

    @Override
    public ResponseEntity<KnowledgeChaptersDto> getKnowledgeChapters() {
        return ResponseEntity.ok(
                new KnowledgeChaptersDto(mapper.toChapters(pipeline.send(new GetKnowledgeChaptersQuery()))));
    }

    @Override
    public ResponseEntity<KnowledgeArticleDto> getKnowledgeArticle(String id) {
        return ResponseEntity.ok(mapper.toResponse(pipeline.send(new GetKnowledgeArticleQuery(id))));
    }

    @Override
    public ResponseEntity<KnowledgeSearchResultDto> searchKnowledge(String q) {
        SearchKnowledgeQuery query = new SearchKnowledgeQuery(q);
        return ResponseEntity.ok(
                new KnowledgeSearchResultDto(query.phrase(), mapper.toSummaries(pipeline.send(query))));
    }
}
