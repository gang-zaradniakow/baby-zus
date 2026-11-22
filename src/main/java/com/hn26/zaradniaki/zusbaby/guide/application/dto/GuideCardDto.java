package com.hn26.zaradniaki.zusbaby.guide.application.dto;

import com.hn26.zaradniaki.zusbaby.guide.domain.card.CardPeriod;

public record GuideCardDto(CardPeriod period, String articleId, String title, String text) {
}
