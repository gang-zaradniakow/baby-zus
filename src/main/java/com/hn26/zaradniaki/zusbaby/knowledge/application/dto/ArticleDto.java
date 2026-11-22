package com.hn26.zaradniaki.zusbaby.knowledge.application.dto;

import java.util.List;

/**
 * Article with the next article of its chapter ({@code null} for the last one).
 */
public record ArticleDto(String id, String chapterId, String title, String lead, String body, String source,
        List<LinkDto> links, ActionDto action, ArticleSummaryDto next) {
}
