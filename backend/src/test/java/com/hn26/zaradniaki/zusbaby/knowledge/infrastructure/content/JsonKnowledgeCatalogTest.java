package com.hn26.zaradniaki.zusbaby.knowledge.infrastructure.content;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatIllegalStateException;

import com.hn26.zaradniaki.zusbaby.knowledge.application.content.Article;
import com.hn26.zaradniaki.zusbaby.knowledge.application.content.Chapter;
import java.util.List;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.json.JsonMapper;

class JsonKnowledgeCatalogTest {

    private static final Chapter CHAPTER = new Chapter("po", "Po narodzinach", "baby", "Zasiłek macierzyński.");

    @Test
    void readsTheExportedContent() {
        var catalog = new JsonKnowledgeCatalog(JsonMapper.builder().build());

        assertThat(catalog.chapters()).extracting(Chapter::id).containsExactly("start", "ubezp", "ciaza", "po",
                "trudne", "opieka", "ryzyka");
        assertThat(catalog.articles()).hasSize(30);
        Article contact = catalog.articles().stream().filter(article -> article.id().equals("kontakt")).findFirst()
                .orElseThrow();
        assertThat(contact.chapterId()).isEqualTo("start");
        assertThat(contact.action().href()).isEqualTo("#/kontakt");
        assertThat(contact.links()).extracting(link -> link.url()).contains("https://www.zus.pl/e-wizyta");
    }

    @Test
    void rejectsDuplicateArticleIds() {
        assertThatIllegalStateException()
                .isThrownBy(() -> new JsonKnowledgeCatalog.KnowledgeContent("test", List.of(CHAPTER),
                        List.of(article("mac", "po"), article("mac", "po"))))
                .withMessageContaining("mac");
    }

    @Test
    void rejectsArticleOfUnknownChapter() {
        assertThatIllegalStateException().isThrownBy(
                () -> new JsonKnowledgeCatalog.KnowledgeContent("test", List.of(CHAPTER), List.of(article("mac", "brak"))))
                .withMessageContaining("brak");
    }

    private static Article article(String id, String chapterId) {
        return new Article(id, chapterId, "Tytuł", "Wstęp", "<p>Treść</p>", "Poradnik", List.of(), null);
    }
}
