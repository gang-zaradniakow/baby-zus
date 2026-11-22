package com.hn26.zaradniaki.zusbaby.knowledge.application.mapper;

import com.hn26.zaradniaki.zusbaby.knowledge.application.content.Article;
import com.hn26.zaradniaki.zusbaby.knowledge.application.content.Chapter;
import com.hn26.zaradniaki.zusbaby.knowledge.application.dto.ArticleDto;
import com.hn26.zaradniaki.zusbaby.knowledge.application.dto.ArticleSummaryDto;
import com.hn26.zaradniaki.zusbaby.knowledge.application.dto.ChapterDto;
import com.hn26.zaradniaki.zusbaby.shared.mapping.MapStructConfig;
import java.util.List;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

/** Content → query results. */
@Mapper(config = MapStructConfig.class)
public interface KnowledgeDtoMapper {

    ChapterDto toDto(Chapter chapter, List<ArticleSummaryDto> articles);

    ArticleSummaryDto toSummary(Article article);

    List<ArticleSummaryDto> toSummaries(List<Article> articles);

    @Mapping(target = "id", source = "article.id")
    @Mapping(target = "chapterId", source = "article.chapterId")
    @Mapping(target = "title", source = "article.title")
    @Mapping(target = "lead", source = "article.lead")
    ArticleDto toDto(Article article, ArticleSummaryDto next);
}
