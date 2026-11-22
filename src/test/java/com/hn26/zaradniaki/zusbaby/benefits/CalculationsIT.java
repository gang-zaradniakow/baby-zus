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
    void calculatesLeaveForPrematureTwins() throws Exception {
        mvc.perform(post("/api/v1/calculations/leave-dimensions").contentType(MediaType.APPLICATION_JSON).content("""
                {"children": 2, "preterm": {"gestationWeek": 27, "birthWeightGrams": 950, "hospitalDays": 49}}
                """)).andExpect(status().isOk()).andExpect(matchesContract())
                .andExpect(jsonPath("$.maternityWeeks").value(31)).andExpect(jsonPath("$.parentalWeeks").value(43))
                .andExpect(jsonPath("$.supplementary.weeks").value(7))
                .andExpect(jsonPath("$.supplementary.limit").value(15))
                .andExpect(jsonPath("$.adoption").doesNotExist());
    }

    @Test
    void calculatesLeaveForChildTakenInCloseToTheAgeLimit() throws Exception {
        mvc.perform(post("/api/v1/calculations/leave-dimensions").contentType(MediaType.APPLICATION_JSON).content("""
                {"children": 1, "adoption": {"type": "FOSTER_FAMILY", "childAge": 6.9}}
                """)).andExpect(status().isOk()).andExpect(matchesContract())
                .andExpect(jsonPath("$.maternityWeeks").value(9)).andExpect(jsonPath("$.parentalWeeks").value(38))
                .andExpect(jsonPath("$.adoption.ageLimit").value(7))
                .andExpect(jsonPath("$.supplementary").doesNotExist());
    }

    @Test
    void rejectsAdoptionTogetherWithPrematureBirth() throws Exception {
        mvc.perform(post("/api/v1/calculations/leave-dimensions").contentType(MediaType.APPLICATION_JSON).content("""
                {"children": 1, "adoption": {"type": "ADOPTION", "childAge": 1},
                 "preterm": {"gestationWeek": 30, "birthWeightGrams": 1500, "hospitalDays": 10}}
                """)).andExpect(status().isBadRequest()).andExpect(matchesContract())
                .andExpect(jsonPath("$.code").value("validation-failed"));
    }

    @Test
    void calculatesSickLeaveInPregnancyPerTitle() throws Exception {
        mvc.perform(post("/api/v1/calculations/sickness-in-pregnancy").contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {
                          "titles": {"employment": {"base": "2000.00", "atLeastMinimumWage": false},
                                     "selfEmployment": {"base": "4877.11", "voluntarySickness": true}},
                          "days": 60
                        }
                        """))
                .andExpect(status().isOk()).andExpect(matchesContract())
                .andExpect(jsonPath("$.parts.length()").value(3))
                .andExpect(jsonPath("$.parts[0].title").value("EMPLOYMENT"))
                .andExpect(jsonPath("$.parts[0].label").value("etat — Wynagrodzenie chorobowe (płaci pracodawca)"))
                .andExpect(jsonPath("$.parts[0].days").value(33)).andExpect(jsonPath("$.parts[2].title")
                        .value("SELF_EMPLOYMENT"))
                .andExpect(jsonPath("$.total").value("13754.22")).andExpect(jsonPath("$.netTotal").value("12103.22"));
    }

    @Test
    void explainsMissingInsuranceForSickLeave() throws Exception {
        mvc.perform(post("/api/v1/calculations/sickness-in-pregnancy").contentType(MediaType.APPLICATION_JSON)
                .content("{\"titles\": {}, \"days\": 30}")).andExpect(status().isOk()).andExpect(matchesContract())
                .andExpect(jsonPath("$.parts.length()").value(0)).andExpect(jsonPath("$.total").value("0.00"))
                .andExpect(jsonPath("$.checks[0].level").value("NO"));
    }

    @Test
    void rejectsSickLeaveWithoutDays() throws Exception {
        mvc.perform(post("/api/v1/calculations/sickness-in-pregnancy").contentType(MediaType.APPLICATION_JSON)
                .content("{\"titles\": {}, \"days\": 0}")).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("validation-failed"));
    }

    @Test
    void simulatesLeaveSplitBetweenParents() throws Exception {
        mvc.perform(post("/api/v1/calculations/maternity").contentType(MediaType.APPLICATION_JSON).content("""
                {
                  "situation": "BIRTH", "startDate": "2026-03-02", "children": 1,
                  "mother": {"employment": {"base": "5177.40"}},
                  "father": {"titles": {"employment": {"base": "6000.00"}}, "maternityWeeksTaken": 6}
                }
                """)).andExpect(status().isOk()).andExpect(matchesContract())
                .andExpect(jsonPath("$.maternityWeeks").value(20)).andExpect(jsonPath("$.mother.maternityWeeks").value(14))
                .andExpect(jsonPath("$.father.maternityWeeks").value(6))
                .andExpect(jsonPath("$.segments[1].parent").value("FATHER"))
                .andExpect(jsonPath("$.segments[1].label").value("Część urlopu macierzyńskiego (przejęta)"))
                .andExpect(jsonPath("$.segments[1].from").value("2026-06-08"))
                .andExpect(jsonPath("$.segments[2].rate").value(0.7))
                .andExpect(jsonPath("$.checks[0].level").value("OK"));
    }

    @Test
    void rejectsTakenInChildWithoutAdoptionDetails() throws Exception {
        mvc.perform(post("/api/v1/calculations/maternity").contentType(MediaType.APPLICATION_JSON).content("""
                {
                  "situation": "ADOPTION", "startDate": "2026-03-02", "children": 1,
                  "mother": {}, "father": {"titles": {}}
                }
                """)).andExpect(status().isBadRequest()).andExpect(matchesContract())
                .andExpect(jsonPath("$.code").value("validation-failed"));
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
