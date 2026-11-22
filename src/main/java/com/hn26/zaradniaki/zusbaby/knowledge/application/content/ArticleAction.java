package com.hn26.zaradniaki.zusbaby.knowledge.application.content;

/**
 * Button of an article leading to a screen of the application.
 * @param href frontend route, e.g. {@code #/kontakt}
 * @param label Polish label
 */
public record ArticleAction(String href, String label) {
}
