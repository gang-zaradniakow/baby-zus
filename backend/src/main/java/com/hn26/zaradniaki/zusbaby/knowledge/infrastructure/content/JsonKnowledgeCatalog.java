package com.hn26.zaradniaki.zusbaby.knowledge.infrastructure.content;

import com.hn26.zaradniaki.zusbaby.knowledge.application.content.Article;
import com.hn26.zaradniaki.zusbaby.knowledge.application.content.Chapter;
import com.hn26.zaradniaki.zusbaby.knowledge.application.content.KnowledgeCatalog;
import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Repository;
import tools.jackson.databind.json.JsonMapper;

/**
 * Adapter of the {@link KnowledgeCatalog} port: content exported from the
 * frontend prototype to {@code content/knowledge.json}
 * ({@code tools/content/export-content.mjs}), read once at startup.
 */
@Repository
class JsonKnowledgeCatalog implements KnowledgeCatalog {

    static final String LOCATION = "content/knowledge.json";

    private final List<Chapter> chapters;
    private final List<Article> articles;

    JsonKnowledgeCatalog(JsonMapper jsonMapper) {
        KnowledgeContent content = read(jsonMapper);
        this.chapters = content.chapters();
        this.articles = content.articles();
    }

    @Override
    public List<Chapter> chapters() {
        return chapters;
    }

    @Override
    public List<Article> articles() {
        return articles;
    }

    private static KnowledgeContent read(JsonMapper jsonMapper) {
        try (InputStream input = new ClassPathResource(LOCATION).getInputStream()) {
            return jsonMapper.readValue(input, KnowledgeContent.class);
        } catch (IOException e) {
            throw new UncheckedIOException("Cannot read " + LOCATION, e);
        }
    }

    /**
     * Layout of the content file. Identifiers are unique and every article belongs
     * to a known chapter.
     */
    record KnowledgeContent(String source, List<Chapter> chapters, List<Article> articles) {

        KnowledgeContent {
            chapters = List.copyOf(chapters);
            articles = List.copyOf(articles);
            requireUnique(chapters.stream().map(Chapter::id).toList(), "chapter");
            requireUnique(articles.stream().map(Article::id).toList(), "article");
            Set<String> chapterIds = chapters.stream().map(Chapter::id).collect(Collectors.toSet());
            articles.stream().filter(article -> !chapterIds.contains(article.chapterId())).findFirst()
                    .ifPresent(article -> {
                        throw new IllegalStateException("Article %s belongs to unknown chapter %s"
                                .formatted(article.id(), article.chapterId()));
                    });
        }

        private static void requireUnique(List<String> ids, String what) {
            Set<String> duplicates = ids.stream().filter(id -> ids.indexOf(id) != ids.lastIndexOf(id))
                    .collect(Collectors.toSet());
            if (!duplicates.isEmpty()) {
                throw new IllegalStateException("Duplicate %s ids: %s".formatted(what, duplicates));
            }
        }
    }
}
