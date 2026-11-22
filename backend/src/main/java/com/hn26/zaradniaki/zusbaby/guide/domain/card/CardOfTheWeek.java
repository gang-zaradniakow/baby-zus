package com.hn26.zaradniaki.zusbaby.guide.domain.card;

/**
 * Card for this week of pregnancy or month of the child's life.
 * @param period week or month
 * @param articleId article of the guide
 * @param title Polish title
 * @param text Polish text
 */
public record CardOfTheWeek(CardPeriod period, String articleId, String title, String text) {
}
