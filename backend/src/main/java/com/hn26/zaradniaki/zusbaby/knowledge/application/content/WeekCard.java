package com.hn26.zaradniaki.zusbaby.knowledge.application.content;

/**
 * Tip for a week of pregnancy or a month of the child's life.
 * @param from first week (month) the card is shown in
 * @param to last week (month), {@code null} when there is no upper limit
 * @param articleId article of the guide the card points to
 * @param title Polish title
 * @param text Polish text
 */
public record WeekCard(int from, Integer to, String articleId, String title, String text) {
}
