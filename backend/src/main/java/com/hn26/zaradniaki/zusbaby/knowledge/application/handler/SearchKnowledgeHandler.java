package com.hn26.zaradniaki.zusbaby.knowledge.application.handler;

import an.awesome.pipelinr.Command;
import com.hn26.zaradniaki.zusbaby.knowledge.application.content.KnowledgeCatalog;
import com.hn26.zaradniaki.zusbaby.knowledge.application.content.SearchText;
import com.hn26.zaradniaki.zusbaby.knowledge.application.dto.ArticleSummaryDto;
import com.hn26.zaradniaki.zusbaby.knowledge.application.mapper.KnowledgeDtoMapper;
import com.hn26.zaradniaki.zusbaby.knowledge.application.query.SearchKnowledgeQuery;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Same search as the "Wiedza" tab of the frontend prototype: the phrase must
 * appear in the title, lead or text of the article.
 */
@Component
@RequiredArgsConstructor
class SearchKnowledgeHandler implements Command.Handler<SearchKnowledgeQuery, List<ArticleSummaryDto>> {

    private final KnowledgeCatalog catalog;
    private final KnowledgeDtoMapper mapper;

    @Override
    @Transactional(readOnly = true)
    public List<ArticleSummaryDto> handle(SearchKnowledgeQuery query) {
        String phrase = SearchText.normalize(query.phrase());
        return mapper.toSummaries(catalog.articles().stream()
                .filter(article -> SearchText
                        .normalize(article.title() + " " + article.lead() + " " + article.body()).contains(phrase))
                .toList());
    }
}
