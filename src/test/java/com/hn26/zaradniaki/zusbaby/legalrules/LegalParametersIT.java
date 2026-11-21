package com.hn26.zaradniaki.zusbaby.legalrules;

import static com.hn26.zaradniaki.zusbaby.OpenApiContract.matchesContract;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import an.awesome.pipelinr.Pipeline;
import com.hn26.zaradniaki.zusbaby.TestcontainersConfiguration;
import com.hn26.zaradniaki.zusbaby.legalrules.api.exception.LegalParametersNotFoundException;
import com.hn26.zaradniaki.zusbaby.legalrules.api.model.ParameterKey;
import com.hn26.zaradniaki.zusbaby.legalrules.application.query.GetCurrentLegalParametersQuery;
import com.hn26.zaradniaki.zusbaby.legalrules.application.query.GetLegalParametersEffectiveOnQuery;
import com.hn26.zaradniaki.zusbaby.shared.time.DateTimeGenerator;
import com.hn26.zaradniaki.zusbaby.shared.time.FixedDateTimeGenerator;
import jakarta.validation.ConstraintViolationException;
import java.time.LocalDate;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.convention.TestBean;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class LegalParametersIT {

    private static final LocalDate TODAY = LocalDate.of(2026, 11, 21);

    @Autowired
    private MockMvc mvc;

    @Autowired
    private Pipeline pipeline;

    @TestBean
    private DateTimeGenerator dateTimeGenerator;

    static DateTimeGenerator dateTimeGenerator() {
        return FixedDateTimeGenerator.onDay(TODAY);
    }

    @BeforeEach
    void resetDay() {
        ((FixedDateTimeGenerator) dateTimeGenerator).setDay(TODAY);
    }

    @Test
    void queriesReturnParametersDefinedInCode() {
        var current = pipeline.send(new GetCurrentLegalParametersQuery());
        var onBirthDay = pipeline.send(new GetLegalParametersEffectiveOnQuery(LocalDate.of(2026, 3, 14)));

        assertThat(current.version()).isEqualTo(1);
        assertThat(current.validFrom()).isEqualTo(LocalDate.of(2026, 1, 1));
        assertThat(current.parameters()).hasSize(ParameterKey.values().length);
        assertThat(current.parameters()).filteredOn(p -> p.key() == ParameterKey.AVERAGED_RATE).singleElement()
                .satisfies(p -> assertThat(p.value()).isEqualByComparingTo("0.815"));
        assertThat(onBirthDay).isEqualTo(current);
    }

    @Test
    void queryValidatesItsInput() {
        assertThatThrownBy(() -> pipeline.send(new GetLegalParametersEffectiveOnQuery(null)))
                .isInstanceOf(ConstraintViolationException.class);
    }

    @Test
    void returnsParametersInForceToday() throws Exception {
        mvc.perform(get("/api/v1/legal-parameters")).andExpect(status().isOk()).andExpect(matchesContract())
                .andExpect(jsonPath("$.version").value(1)).andExpect(jsonPath("$.validFrom").value("2026-01-01"))
                .andExpect(jsonPath("$.parameters", hasSize(ParameterKey.values().length)))
                .andExpect(jsonPath("$.parameters[?(@.key == 'MINIMUM_WAGE')].value").value(4806))
                .andExpect(jsonPath("$.parameters[?(@.key == 'MINIMUM_WAGE')].kind").value("AMOUNT"))
                .andExpect(jsonPath("$.parameters[?(@.key == 'AVERAGED_RATE')].value").value(0.815))
                .andExpect(jsonPath("$.parameters[?(@.key == 'MATERNITY_LEAVE_WEEKS')].values[0]").value(contains(20)));
    }

    @Test
    void returns404BeforeTheFirstVersionIsInForce() throws Exception {
        ((FixedDateTimeGenerator) dateTimeGenerator).setDay(LocalDate.of(2025, 12, 31));

        mvc.perform(get("/api/v1/legal-parameters")).andExpect(status().isNotFound()).andExpect(matchesContract())
                .andExpect(jsonPath("$.code").value(LegalParametersNotFoundException.CODE));
    }
}
