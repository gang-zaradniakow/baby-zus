package com.hn26.zaradniaki.zusbaby.knowledge.infrastructure.content;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatIllegalStateException;

import com.hn26.zaradniaki.zusbaby.knowledge.application.content.Article;
import com.hn26.zaradniaki.zusbaby.knowledge.application.content.Chapter;
import com.hn26.zaradniaki.zusbaby.knowledge.application.content.Form;
import com.hn26.zaradniaki.zusbaby.knowledge.application.content.KnowledgeCatalog;
import com.hn26.zaradniaki.zusbaby.knowledge.application.content.WeekCard;
import com.hn26.zaradniaki.zusbaby.knowledge.application.content.WeekCards;
import java.util.List;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.json.JsonMapper;

class JsonDictionaryCatalogTest {

    private static final JsonMapper JSON = JsonMapper.builder().build();

    @Test
    void readsTheExportedDictionariesAndChecksWeekCardsAgainstTheGuide() {
        var catalog = new JsonDictionaryCatalog(JSON, new JsonKnowledgeCatalog(JSON));

        assertThat(catalog.forms()).hasSize(11).first().isEqualTo(new Form("ZAM",
                "Wniosek o zasiłek macierzyński — za urlop macierzyński, rodzicielski i ojcowski (od 24.10.2026 zastępuje też ZUR i ZAO)"));
        assertThat(catalog.facts()).hasSize(10);
        assertThat(catalog.organizations()).hasSize(8);
        // organisations without a known website have no url
        assertThat(catalog.organizations().get(1).url()).isNull();
        assertThat(catalog.helplines()).extracting(helpline -> helpline.number()).containsExactly("116 123",
                "800 120 002", "112");
        assertThat(catalog.links()).hasSize(5);
        assertThat(catalog.weekCards().pregnancy()).hasSize(4);
        // the last child card has no upper limit
        assertThat(catalog.weekCards().child().getLast()).isEqualTo(new WeekCard(12, null, "opiekunczy",
                "Gdy maluch zachoruje", "Zasiłek opiekuńczy: 80% podstawy, do 60 dni w roku. Wniosek Z-15A."));
    }

    @Test
    void rejectsWeekCardOfUnknownArticle() {
        KnowledgeCatalog withoutArticles = new KnowledgeCatalog() {
            @Override
            public List<Chapter> chapters() {
                return List.of();
            }

            @Override
            public List<Article> articles() {
                return List.of();
            }
        };

        assertThatIllegalStateException().isThrownBy(() -> new JsonDictionaryCatalog(JSON, withoutArticles))
                .withMessageContaining("unknown article");
    }

    @Test
    void rejectsDuplicateFormCodes() {
        assertThatIllegalStateException().isThrownBy(() -> content(
                List.of(new Form("Z-3", "a"), new Form("Z-3", "b")), new WeekCards(List.of(), List.of())))
                .withMessageContaining("Z-3");
    }

    @Test
    void rejectsWeekCardEndingBeforeItStarts() {
        assertThatIllegalStateException()
                .isThrownBy(() -> content(List.of(),
                        new WeekCards(List.of(new WeekCard(20, 10, "l4", "Odwrotnie", "tekst")), List.of())))
                .withMessageContaining("Odwrotnie");
    }

    private static JsonDictionaryCatalog.DictionaryContent content(List<Form> forms, WeekCards cards) {
        return new JsonDictionaryCatalog.DictionaryContent("test", forms, List.of(), List.of(), List.of(), List.of(),
                cards);
    }
}
