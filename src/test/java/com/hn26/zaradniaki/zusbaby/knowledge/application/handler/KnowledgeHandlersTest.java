package com.hn26.zaradniaki.zusbaby.knowledge.application.handler;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.hn26.zaradniaki.zusbaby.knowledge.application.content.Article;
import com.hn26.zaradniaki.zusbaby.knowledge.application.content.ArticleAction;
import com.hn26.zaradniaki.zusbaby.knowledge.application.content.ArticleLink;
import com.hn26.zaradniaki.zusbaby.knowledge.application.content.Chapter;
import com.hn26.zaradniaki.zusbaby.knowledge.application.content.KnowledgeCatalog;
import com.hn26.zaradniaki.zusbaby.knowledge.application.dto.ActionDto;
import com.hn26.zaradniaki.zusbaby.knowledge.application.dto.ArticleSummaryDto;
import com.hn26.zaradniaki.zusbaby.knowledge.application.dto.LinkDto;
import com.hn26.zaradniaki.zusbaby.knowledge.application.exception.ArticleNotFoundException;
import com.hn26.zaradniaki.zusbaby.knowledge.application.mapper.KnowledgeDtoMapper;
import com.hn26.zaradniaki.zusbaby.knowledge.application.query.GetKnowledgeArticleQuery;
import com.hn26.zaradniaki.zusbaby.knowledge.application.query.GetKnowledgeChaptersQuery;
import com.hn26.zaradniaki.zusbaby.knowledge.application.query.SearchKnowledgeQuery;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;

class KnowledgeHandlersTest {

    private static final KnowledgeCatalog CATALOG = new KnowledgeCatalog() {
        @Override
        public List<Chapter> chapters() {
            return List.of(new Chapter("ciaza", "W ciąży", "heart", "Zwolnienie lekarskie."),
                    new Chapter("po", "Po narodzinach", "baby", "Zasiłek macierzyński."),
                    new Chapter("pusty", "Bez artykułów", "info", "Nic tu nie ma."));
        }

        @Override
        public List<Article> articles() {
            return List.of(
                    new Article("l4", "ciaza", "Zwolnienie w ciąży", "Kod B to 100%.",
                            "<p>Zasiłek <b>chorobowy</b> wypłaca płatnik.</p>", "Poradnik, s. 23",
                            List.of(new ArticleLink("https://www.zus.pl", "ZUS")), null),
                    new Article("mac", "po", "Urlop macierzyński", "20 tygodni.", "<div class=\"wazne\">Łódź</div>",
                            "Poradnik, s. 12", List.of(), new ArticleAction("#/kontakt", "Kontakt z ZUS")),
                    new Article("rodz", "po", "Urlop rodzicielski", "41 tygodni.", "<p>Do połowy etatu.</p>",
                            "Poradnik, s. 14", List.of(), null));
        }
    };

    private final KnowledgeDtoMapper mapper = Mappers.getMapper(KnowledgeDtoMapper.class);

    @Test
    void groupsArticlesUnderTheirChaptersInReadingOrder() {
        var chapters = new GetKnowledgeChaptersHandler(CATALOG, mapper).handle(new GetKnowledgeChaptersQuery());

        assertThat(chapters).extracting(chapter -> chapter.id()).containsExactly("ciaza", "po", "pusty");
        assertThat(chapters.get(1).articles()).containsExactly(
                new ArticleSummaryDto("mac", "po", "Urlop macierzyński", "20 tygodni."),
                new ArticleSummaryDto("rodz", "po", "Urlop rodzicielski", "41 tygodni."));
        assertThat(chapters.get(2).articles()).isEmpty();
    }

    @Test
    void returnsArticleWithTheNextOneOfItsChapter() {
        var article = new GetKnowledgeArticleHandler(CATALOG, mapper).handle(new GetKnowledgeArticleQuery("mac"));

        assertThat(article.title()).isEqualTo("Urlop macierzyński");
        assertThat(article.body()).isEqualTo("<div class=\"wazne\">Łódź</div>");
        assertThat(article.action()).isEqualTo(new ActionDto("#/kontakt", "Kontakt z ZUS"));
        assertThat(article.next()).isEqualTo(new ArticleSummaryDto("rodz", "po", "Urlop rodzicielski", "41 tygodni."));
    }

    @Test
    void lastArticleOfAChapterHasNoNextOne() {
        var handler = new GetKnowledgeArticleHandler(CATALOG, mapper);

        assertThat(handler.handle(new GetKnowledgeArticleQuery("rodz")).next()).isNull();
        // the next article in another chapter does not count
        var l4 = handler.handle(new GetKnowledgeArticleQuery("l4"));
        assertThat(l4.next()).isNull();
        assertThat(l4.links()).containsExactly(new LinkDto("https://www.zus.pl", "ZUS"));
    }

    @Test
    void failsForUnknownArticle() {
        var handler = new GetKnowledgeArticleHandler(CATALOG, mapper);

        assertThatThrownBy(() -> handler.handle(new GetKnowledgeArticleQuery("brak")))
                .isInstanceOf(ArticleNotFoundException.class);
    }

    @Test
    void searchesTitleLeadAndTextIgnoringCaseAndDiacritics() {
        var handler = new SearchKnowledgeHandler(CATALOG, mapper);

        assertThat(search(handler, "ZASILEK")).containsExactly("l4");
        assertThat(search(handler, "lodz")).containsExactly("mac");
        assertThat(search(handler, "kod b")).containsExactly("l4");
        assertThat(search(handler, "urlop")).containsExactly("mac", "rodz");
        assertThat(search(handler, "  połowy  ")).containsExactly("rodz");
    }

    @Test
    void doesNotSearchInsideHtmlTags() {
        var handler = new SearchKnowledgeHandler(CATALOG, mapper);

        assertThat(search(handler, "class")).isEmpty();
        assertThat(search(handler, "chorobowy wypłaca")).containsExactly("l4");
    }

    private static List<String> search(SearchKnowledgeHandler handler, String phrase) {
        return handler.handle(new SearchKnowledgeQuery(phrase)).stream().map(ArticleSummaryDto::id).toList();
    }
}
