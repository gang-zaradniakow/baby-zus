package com.hn26.zaradniaki.zusbaby.knowledge.application.query;

import an.awesome.pipelinr.Command;
import com.hn26.zaradniaki.zusbaby.knowledge.application.dto.ArticleDto;
import jakarta.validation.constraints.NotBlank;

/** One article with the next article of its chapter. */
public record GetKnowledgeArticleQuery(@NotBlank String id) implements Command<ArticleDto> {
}
