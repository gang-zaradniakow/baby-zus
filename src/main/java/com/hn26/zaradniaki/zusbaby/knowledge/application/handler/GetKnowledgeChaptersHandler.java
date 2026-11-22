package com.hn26.zaradniaki.zusbaby.knowledge.application.handler;

import an.awesome.pipelinr.Command;
import com.hn26.zaradniaki.zusbaby.knowledge.application.content.KnowledgeCatalog;
import com.hn26.zaradniaki.zusbaby.knowledge.application.dto.ChapterDto;
import com.hn26.zaradniaki.zusbaby.knowledge.application.mapper.KnowledgeDtoMapper;
import com.hn26.zaradniaki.zusbaby.knowledge.application.query.GetKnowledgeChaptersQuery;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
class GetKnowledgeChaptersHandler implements Command.Handler<GetKnowledgeChaptersQuery, List<ChapterDto>> {

    private final KnowledgeCatalog catalog;
    private final KnowledgeDtoMapper mapper;

    @Override
    @Transactional(readOnly = true)
    public List<ChapterDto> handle(GetKnowledgeChaptersQuery query) {
        return catalog.chapters().stream()
                .map(chapter -> mapper.toDto(chapter, mapper.toSummaries(catalog.articles().stream()
                        .filter(article -> article.chapterId().equals(chapter.id())).toList())))
                .toList();
    }
}
