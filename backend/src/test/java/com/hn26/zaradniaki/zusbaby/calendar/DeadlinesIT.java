package com.hn26.zaradniaki.zusbaby.calendar;

import static com.hn26.zaradniaki.zusbaby.OpenApiContract.matchesContract;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import an.awesome.pipelinr.Pipeline;
import com.hn26.zaradniaki.zusbaby.TestcontainersConfiguration;
import com.hn26.zaradniaki.zusbaby.calendar.api.model.DeadlineType;
import com.hn26.zaradniaki.zusbaby.calendar.application.query.CalculateDeadlineQuery;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class DeadlinesIT {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private Pipeline pipeline;

    @Test
    void calculatesDeadlineAfterBirth() throws Exception {
        mvc.perform(get("/api/v1/deadlines").param("event", "2026-12-03").param("type", "AFTER").param("days", "21"))
                .andExpect(status().isOk()).andExpect(matchesContract()).andExpect(jsonPath("$.type").value("AFTER"))
                .andExpect(jsonPath("$.raw").value("2026-12-24")).andExpect(jsonPath("$.legal").value("2026-12-28"))
                .andExpect(jsonPath("$.shifted").value(true))
                .andExpect(jsonPath("$.reason").value("Wigilia (od 2025 r.)"))
                .andExpect(jsonPath("$.safe").value("2026-12-23"));
    }

    @Test
    void omitsReasonForAWorkingDay() throws Exception {
        mvc.perform(get("/api/v1/deadlines").param("event", "2026-11-23").param("type", "BEFORE").param("days", "7"))
                .andExpect(status().isOk()).andExpect(matchesContract()).andExpect(jsonPath("$.reason").doesNotExist())
                .andExpect(jsonPath("$.legal").value("2026-11-16"));
    }

    @Test
    void calculatesDeadlineInMonths() throws Exception {
        mvc.perform(get("/api/v1/deadlines").param("event", "2026-11-30").param("type", "AFTER").param("months", "3"))
                .andExpect(status().isOk()).andExpect(matchesContract())
                .andExpect(jsonPath("$.legal").value("2027-03-01")).andExpect(jsonPath("$.reason").value("niedziela"));
    }

    @ParameterizedTest
    @ValueSource(strings = {"type=AFTER", "type=AFTER&days=21&months=3", "type=BEFORE&months=1"})
    void rejectsMissingOrContradictoryPeriod(String parameters) throws Exception {
        mvc.perform(get("/api/v1/deadlines?event=2026-11-21&" + parameters)).andExpect(status().isBadRequest())
                .andExpect(matchesContract()).andExpect(jsonPath("$.code").value("validation-failed"));
    }

    @Test
    void rejectsPeriodOutOfRange() throws Exception {
        mvc.perform(get("/api/v1/deadlines").param("event", "2026-11-21").param("type", "AFTER").param("days", "0"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("validation-failed"));
    }

    @Test
    void otherModulesCanSendTheQuery() {
        var deadline = pipeline.send(new CalculateDeadlineQuery(LocalDate.of(2026, 11, 21), DeadlineType.AFTER, 21, null));

        assertThat(deadline.legal()).isEqualTo(LocalDate.of(2026, 12, 14));
    }
}
