package com.hn26.zaradniaki.zusbaby.knowledge.application.content;

import java.util.List;

/** Port: content of the guide for parents, in reading order. */
public interface KnowledgeCatalog {

    List<Chapter> chapters();

    List<Article> articles();
}
