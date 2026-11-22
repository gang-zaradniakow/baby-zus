package com.hn26.zaradniaki.zusbaby.knowledge.application.content;

import java.util.List;

/**
 * Article of the guide for parents.
 * @param id stable identifier used in links
 * @param chapterId chapter the article belongs to
 * @param title Polish title
 * @param lead one-sentence introduction
 * @param body text as HTML
 * @param source pages of the ZUS guide the article is based on
 * @param links external pages
 * @param action button leading to a screen of the application, may be
 *            {@code null}
 */
public record Article(String id, String chapterId, String title, String lead, String body, String source,
        List<ArticleLink> links, ArticleAction action) {

    public Article {
        links = links == null ? List.of() : List.copyOf(links);
    }
}
