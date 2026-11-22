package com.hn26.zaradniaki.zusbaby.knowledge.application.dto;

import java.util.List;

public record ChapterDto(String id, String title, String icon, String lead, List<ArticleSummaryDto> articles) {
}
