package com.hn26.zaradniaki.zusbaby.knowledge.infrastructure.web;

import com.hn26.zaradniaki.zusbaby.api.model.KnowledgeArticleDto;
import com.hn26.zaradniaki.zusbaby.api.model.KnowledgeArticleSummaryDto;
import com.hn26.zaradniaki.zusbaby.api.model.KnowledgeChapterDto;
import com.hn26.zaradniaki.zusbaby.knowledge.application.dto.ArticleDto;
import com.hn26.zaradniaki.zusbaby.knowledge.application.dto.ArticleSummaryDto;
import com.hn26.zaradniaki.zusbaby.knowledge.application.dto.ChapterDto;
import com.hn26.zaradniaki.zusbaby.shared.mapping.MapStructConfig;
import java.util.List;
import org.mapstruct.Mapper;

/** Query results → generated REST DTOs. */
@Mapper(config = MapStructConfig.class)
interface KnowledgeWebMapper {

    List<KnowledgeChapterDto> toChapters(List<ChapterDto> chapters);

    KnowledgeArticleDto toResponse(ArticleDto article);

    List<KnowledgeArticleSummaryDto> toSummaries(List<ArticleSummaryDto> articles);
}
