package com.hn26.zaradniaki.zusbaby.knowledge.application.content;

/**
 * Charity organisation helping parents in a difficult situation.
 * @param name name of the organisation
 * @param topic what it helps with
 * @param url website, {@code null} when unknown
 */
public record Organization(String name, String topic, String url) {
}
