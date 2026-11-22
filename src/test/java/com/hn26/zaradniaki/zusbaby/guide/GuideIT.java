package com.hn26.zaradniaki.zusbaby.guide;

import static com.hn26.zaradniaki.zusbaby.OpenApiContract.matchesContract;
import static org.hamcrest.Matchers.contains;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.hn26.zaradniaki.zusbaby.TestcontainersConfiguration;
import com.hn26.zaradniaki.zusbaby.shared.time.DateTimeGenerator;
import com.hn26.zaradniaki.zusbaby.shared.time.FixedDateTimeGenerator;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.convention.TestBean;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class GuideIT {

    @Autowired
    private MockMvc mvc;

    @TestBean
    private DateTimeGenerator dateTimeGenerator;

    static DateTimeGenerator dateTimeGenerator() {
        return FixedDateTimeGenerator.onDay(LocalDate.of(2026, 11, 22));
    }

    @Test
    void previewsTheGuideOfASelfEmployedMotherWithTheCalendarsDeadlines() throws Exception {
        mvc.perform(post("/api/v1/guide/preview").contentType(MediaType.APPLICATION_JSON).content("""
                {"role": "MOTHER", "stage": "CHILD", "date": "2026-11-06", "children": 1,
                 "work": ["SELF_EMPLOYMENT"], "partner": "SHOW_PARTNER"}
                """)).andExpect(status().isOk()).andExpect(matchesContract())
                .andExpect(jsonPath("$.stage.childAgeLabel").value("2 tyg. 2 dni"))
                .andExpect(jsonPath("$.alerts").isEmpty())
                .andExpect(jsonPath("$.timeline[*].key", contains("w81", "mac-end", "tata9", "przedawn", "ojcowski",
                        "rodz-1y", "zua", "wiek-8", "wiek-14")))
                .andExpect(jsonPath("$.timeline[0].institution").value("ZUS"))
                .andExpect(jsonPath("$.timeline[0].deadline.legal").value("2026-11-27"))
                .andExpect(jsonPath("$.timeline[0].status").value("NOW"))
                .andExpect(jsonPath("$.timeline[0].daysLeft").value(5))
                .andExpect(jsonPath("$.timeline[4].deadline.reason").value("sobota"));
    }

    @Test
    void warnsAboutMissingSicknessInsuranceInPregnancy() throws Exception {
        mvc.perform(post("/api/v1/guide/preview").contentType(MediaType.APPLICATION_JSON).content("""
                {"role": "MOTHER", "stage": "PREGNANCY", "date": "2027-03-22", "children": 1,
                 "work": ["STARTUP_RELIEF"], "partner": "ONLY_ME"}
                """)).andExpect(status().isOk()).andExpect(matchesContract())
                .andExpect(jsonPath("$.stage.pregnancyWeks").doesNotExist())
                .andExpect(jsonPath("$.stage.pregnancyWeek").value(22))
                .andExpect(jsonPath("$.alerts[*].level", contains("INFO", "WARNING")))
                .andExpect(jsonPath("$.timeline[*].key", contains("chor-brak")));
    }

    @Test
    void rejectsChildTakenInWithoutBirthDate() throws Exception {
        mvc.perform(post("/api/v1/guide/preview").contentType(MediaType.APPLICATION_JSON).content("""
                {"role": "GUARDIAN", "stage": "ADOPTION", "date": "2026-11-17", "children": 1,
                 "work": ["EMPLOYMENT"], "partner": "SHOW_PARTNER"}
                """)).andExpect(status().isBadRequest()).andExpect(matchesContract())
                .andExpect(jsonPath("$.code").value("validation-failed"));
    }

    @Test
    void rejectsSurveyWithoutWork() throws Exception {
        mvc.perform(post("/api/v1/guide/preview").contentType(MediaType.APPLICATION_JSON).content("""
                {"role": "MOTHER", "stage": "CHILD", "date": "2026-11-06", "children": 1,
                 "work": [], "partner": "SHOW_PARTNER"}
                """)).andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("validation-failed"));
    }
}
