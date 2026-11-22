package com.hn26.zaradniaki.zusbaby.knowledge.infrastructure.content;

import com.hn26.zaradniaki.zusbaby.knowledge.application.content.Article;
import com.hn26.zaradniaki.zusbaby.knowledge.application.content.ArticleLink;
import com.hn26.zaradniaki.zusbaby.knowledge.application.content.DictionaryCatalog;
import com.hn26.zaradniaki.zusbaby.knowledge.application.content.Form;
import com.hn26.zaradniaki.zusbaby.knowledge.application.content.Helpline;
import com.hn26.zaradniaki.zusbaby.knowledge.application.content.KnowledgeCatalog;
import com.hn26.zaradniaki.zusbaby.knowledge.application.content.Organization;
import com.hn26.zaradniaki.zusbaby.knowledge.application.content.WeekCards;
import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Repository;
import tools.jackson.databind.json.JsonMapper;

/**
 * Adapter of the {@link DictionaryCatalog} port: dictionaries exported from the
 * frontend prototype to {@code content/dictionaries.json}
 * ({@code tools/content/export-content.mjs}), read once at startup. Every week
 * card must point to an article of the {@link KnowledgeCatalog}.
 */
@Repository
class JsonDictionaryCatalog implements DictionaryCatalog {

    static final String LOCATION = "content/dictionaries.json";

    private final DictionaryContent content;

    JsonDictionaryCatalog(JsonMapper jsonMapper, KnowledgeCatalog knowledge) {
        this.content = read(jsonMapper);
        Set<String> articleIds = knowledge.articles().stream().map(Article::id).collect(Collectors.toSet());
        Stream.concat(content.weekCards().pregnancy().stream(), content.weekCards().child().stream())
                .filter(card -> !articleIds.contains(card.articleId())).findFirst().ifPresent(card -> {
                    throw new IllegalStateException(
                            "Week card \"%s\" points to unknown article %s".formatted(card.title(), card.articleId()));
                });
    }

    @Override
    public List<Form> forms() {
        return content.forms();
    }

    @Override
    public List<String> facts() {
        return content.facts();
    }

    @Override
    public List<Organization> organizations() {
        return content.organizations();
    }

    @Override
    public List<Helpline> helplines() {
        return content.helplines();
    }

    @Override
    public List<ArticleLink> links() {
        return content.links();
    }

    @Override
    public WeekCards weekCards() {
        return content.weekCards();
    }

    private static DictionaryContent read(JsonMapper jsonMapper) {
        try (InputStream input = new ClassPathResource(LOCATION).getInputStream()) {
            return jsonMapper.readValue(input, DictionaryContent.class);
        } catch (IOException e) {
            throw new UncheckedIOException("Cannot read " + LOCATION, e);
        }
    }

    /**
     * Layout of the content file. Form codes are unique and a week card never ends
     * before it starts.
     */
    record DictionaryContent(String source, List<Form> forms, List<String> facts, List<Organization> organizations,
            List<Helpline> helplines, List<ArticleLink> links, WeekCards weekCards) {

        DictionaryContent {
            forms = List.copyOf(forms);
            facts = List.copyOf(facts);
            organizations = List.copyOf(organizations);
            helplines = List.copyOf(helplines);
            links = List.copyOf(links);
            List<String> codes = forms.stream().map(Form::code).toList();
            if (Set.copyOf(codes).size() != codes.size()) {
                throw new IllegalStateException("Duplicate form codes: " + codes);
            }
            Stream.concat(weekCards.pregnancy().stream(), weekCards.child().stream())
                    .filter(card -> card.to() != null && card.to() < card.from()).findFirst()
                    .ifPresent(card -> {
                        throw new IllegalStateException("Week card \"%s\" ends (%d) before it starts (%d)"
                                .formatted(card.title(), card.to(), card.from()));
                    });
        }
    }
}
