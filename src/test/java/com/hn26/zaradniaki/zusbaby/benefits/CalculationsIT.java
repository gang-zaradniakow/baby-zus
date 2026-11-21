package com.hn26.zaradniaki.zusbaby.benefits;

import static com.hn26.zaradniaki.zusbaby.OpenApiContract.matchesContract;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.hn26.zaradniaki.zusbaby.TestcontainersConfiguration;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class CalculationsIT {

    @Autowired
    private MockMvc mvc;

    @Test
    void resolvesConcurrentTitles() throws Exception {
        mvc.perform(post("/api/v1/calculations/insurance").contentType(MediaType.APPLICATION_JSON).content("""
                {
                  "employment": {"base": "2000.00", "atLeastMinimumWage": false},
                  "selfEmployment": {"base": "4877.11", "voluntarySickness": true}
                }
                """)).andExpect(status().isOk()).andExpect(matchesContract())
                .andExpect(jsonPath("$.mainTitle").value("EMPLOYMENT"))
                .andExpect(jsonPath("$.base").value("6877.11"))
                .andExpect(jsonPath("$.parts.length()").value(2))
                .andExpect(jsonPath("$.parts[1].title").value("SELF_EMPLOYMENT"))
                .andExpect(jsonPath("$.checks[0].level").value("OK"))
                .andExpect(jsonPath("$.blockingDebt").value("0.00"));
    }

    @Test
    void omitsMainTitleWhenNoTitleGivesABenefit() throws Exception {
        mvc.perform(post("/api/v1/calculations/insurance").contentType(MediaType.APPLICATION_JSON)
                .content("{\"mandateContract\": {\"base\": \"3883.05\", \"voluntarySickness\": true, \"student\": true}}"))
                .andExpect(status().isOk()).andExpect(matchesContract()).andExpect(jsonPath("$.mainTitle").doesNotExist())
                .andExpect(jsonPath("$.checks[1].level").value("NO"));
    }

    @Test
    void calculatesBenefitBaseFromZ3() throws Exception {
        mvc.perform(post("/api/v1/calculations/benefit-base").contentType(MediaType.APPLICATION_JSON).content("""
                {
                  "title": "EMPLOYMENT",
                  "months": [{"amount": "3000.00"}, {"amount": "3000.00"}, {"amount": "800.00", "skip": true}]
                }
                """)).andExpect(status().isOk()).andExpect(matchesContract())
                .andExpect(jsonPath("$.base").value("4147.10")).andExpect(jsonPath("$.average").value("3000.00"))
                .andExpect(jsonPath("$.monthsCounted").value(2));
    }

    @Test
    void rejectsEmptyListOfMonths() throws Exception {
        mvc.perform(post("/api/v1/calculations/benefit-base").contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\": \"EMPLOYMENT\", \"months\": []}")).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("validation-failed"));
    }

    @Test
    void rejectsMoneyInWrongFormat() throws Exception {
        mvc.perform(post("/api/v1/calculations/insurance").contentType(MediaType.APPLICATION_JSON)
                .content("{\"employment\": {\"base\": \"5177,40\"}}")).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("validation-failed"));
    }
}
