package com.hn26.zaradniaki.zusbaby.guide.domain.card;

/**
 * Card shown from week (month) {@code from} to {@code to}, from the knowledge
 * module.
 * @param to {@code null} when there is no upper limit
 */
public record WeekCard(int from, Integer to, String articleId, String title, String text) {

    boolean covers(int value) {
        return value >= from && (to == null || value <= to);
    }
}
