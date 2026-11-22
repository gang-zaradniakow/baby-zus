package com.hn26.zaradniaki.zusbaby.knowledge.application.handler;

import an.awesome.pipelinr.Command;
import com.hn26.zaradniaki.zusbaby.knowledge.application.content.Article;
import com.hn26.zaradniaki.zusbaby.knowledge.application.content.KnowledgeCatalog;
import com.hn26.zaradniaki.zusbaby.knowledge.application.dto.ArticleDto;
import com.hn26.zaradniaki.zusbaby.knowledge.application.exception.ArticleNotFoundException;
import com.hn26.zaradniaki.zusbaby.knowledge.application.mapper.KnowledgeDtoMapper;
import com.hn26.zaradniaki.zusbaby.knowledge.application.query.GetKnowledgeArticleQuery;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
class GetKnowledgeArticleHandler implements Command.Handler<GetKnowledgeArticleQuery, ArticleDto> {

    private final KnowledgeCatalog catalog;
    private final KnowledgeDtoMapper mapper;

    @Override
    @Transactional(readOnly = true)
    public ArticleDto handle(GetKnowledgeArticleQuery query) {
        Article article = catalog.articles().stream().filter(candidate -> candidate.id().equals(query.id()))
                .findFirst().orElseThrow(ArticleNotFoundException::new);
        List<Article> chapter = catalog.articles().stream()
                .filter(candidate -> candidate.chapterId().equals(article.chapterId())).toList();
        int position = chapter.indexOf(article);
        Article next = position + 1 < chapter.size() ? chapter.get(position + 1) : null;
        return mapper.toDto(article, next == null ? null : mapper.toSummary(next));
    }
}
