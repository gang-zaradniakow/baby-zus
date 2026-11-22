package com.hn26.zaradniaki.zusbaby.knowledge.application.content;

import java.util.List;

/**
 * Port: read-only dictionaries shown around the application, in display order.
 */
public interface DictionaryCatalog {

    List<Form> forms();

    List<String> facts();

    List<Organization> organizations();

    List<Helpline> helplines();

    /** Useful official pages. */
    List<ArticleLink> links();

    WeekCards weekCards();
}
