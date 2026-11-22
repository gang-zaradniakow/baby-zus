package com.hn26.zaradniaki.zusbaby.knowledge;

import static com.hn26.zaradniaki.zusbaby.OpenApiContract.matchesContract;
import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.hasItem;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.hn26.zaradniaki.zusbaby.TestcontainersConfiguration;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class KnowledgeIT {

    @Autowired
    private MockMvc mvc;

    @Test
    void listsChaptersWithTheirArticles() throws Exception {
        mvc.perform(get("/api/v1/knowledge/chapters")).andExpect(status().isOk()).andExpect(matchesContract())
                .andExpect(jsonPath("$.chapters.length()").value(7))
                .andExpect(jsonPath("$.chapters[0].id").value("start"))
                .andExpect(jsonPath("$.chapters[0].articles[*].id", contains("pojecia", "kontakt")));
    }

    @Test
    void returnsArticleWithLinksActionAndNextArticle() throws Exception {
        mvc.perform(get("/api/v1/knowledge/articles/pojecia")).andExpect(status().isOk())
                .andExpect(matchesContract()).andExpect(jsonPath("$.title").value("Objaśnienie pojęć"))
                .andExpect(jsonPath("$.chapterId").value("start"))
                .andExpect(jsonPath("$.links[0].label").value("ZUS dla przyszłych mam i rodziców (zus.pl)"))
                .andExpect(jsonPath("$.action").doesNotExist()).andExpect(jsonPath("$.next.id").value("kontakt"));
        mvc.perform(get("/api/v1/knowledge/articles/kontakt")).andExpect(status().isOk())
                .andExpect(matchesContract()).andExpect(jsonPath("$.action.href").value("#/kontakt"))
                .andExpect(jsonPath("$.next").doesNotExist());
    }

    @Test
    void answersNotFoundForUnknownArticle() throws Exception {
        mvc.perform(get("/api/v1/knowledge/articles/brak")).andExpect(status().isNotFound())
                .andExpect(matchesContract()).andExpect(jsonPath("$.code").value("article-not-found"));
    }

    @Test
    void searchesWithoutPolishDiacritics() throws Exception {
        mvc.perform(get("/api/v1/knowledge/search").param("q", "ulga na start")).andExpect(status().isOk())
                .andExpect(matchesContract()).andExpect(jsonPath("$.query").value("ulga na start"))
                .andExpect(jsonPath("$.articles[*].id", contains("jdg")));
        mvc.perform(get("/api/v1/knowledge/search").param("q", "zasilek macierzynski")).andExpect(status().isOk())
                .andExpect(matchesContract()).andExpect(jsonPath("$.articles[*].id", hasItem("mac-podstawy")));
    }

    @Test
    void rejectsTooShortPhrase() throws Exception {
        mvc.perform(get("/api/v1/knowledge/search").param("q", "a")).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("validation-failed"));
    }
}
