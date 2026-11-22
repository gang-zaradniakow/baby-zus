package com.hn26.zaradniaki.zusbaby.knowledge;

import static com.hn26.zaradniaki.zusbaby.OpenApiContract.matchesContract;
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
class ContentIT {

    @Autowired
    private MockMvc mvc;

    @Test
    void listsForms() throws Exception {
        mvc.perform(get("/api/v1/content/forms")).andExpect(status().isOk()).andExpect(matchesContract())
                .andExpect(jsonPath("$.forms.length()").value(11)).andExpect(jsonPath("$.forms[0].code").value("ZAM"));
    }

    @Test
    void listsFacts() throws Exception {
        mvc.perform(get("/api/v1/content/facts")).andExpect(status().isOk()).andExpect(matchesContract())
                .andExpect(jsonPath("$.facts.length()").value(10));
    }

    @Test
    void listsSupportContactsWithoutUnknownWebsites() throws Exception {
        mvc.perform(get("/api/v1/content/support")).andExpect(status().isOk()).andExpect(matchesContract())
                .andExpect(jsonPath("$.organizations[0].url").value("https://rodzicpoludzku.pl"))
                .andExpect(jsonPath("$.organizations[1].url").doesNotExist())
                .andExpect(jsonPath("$.helplines[2].number").value("112"))
                .andExpect(jsonPath("$.links[0].url").value("https://www.zus.pl"));
    }

    @Test
    void listsWeekCards() throws Exception {
        mvc.perform(get("/api/v1/content/week-cards")).andExpect(status().isOk()).andExpect(matchesContract())
                .andExpect(jsonPath("$.pregnancy[0].from").value(1)).andExpect(jsonPath("$.pregnancy[0].to").value(20))
                .andExpect(jsonPath("$.pregnancy[0].articleId").value("l4-ciaza"))
                .andExpect(jsonPath("$.child[4].from").value(12)).andExpect(jsonPath("$.child[4].to").doesNotExist());
    }
}
