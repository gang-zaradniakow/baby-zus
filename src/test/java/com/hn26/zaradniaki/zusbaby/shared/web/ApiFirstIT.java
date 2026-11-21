package com.hn26.zaradniaki.zusbaby.shared.web;

import static com.hn26.zaradniaki.zusbaby.OpenApiContract.matchesContract;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.hn26.zaradniaki.zusbaby.TestcontainersConfiguration;
import com.hn26.zaradniaki.zusbaby.shared.time.DateTimeGenerator;
import com.hn26.zaradniaki.zusbaby.shared.time.FixedDateTimeGenerator;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.test.context.bean.override.convention.TestBean;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class ApiFirstIT {

    private static final String FRONTEND = "http://localhost:8765";

    @Autowired
    private MockMvc mvc;

    @TestBean
    private DateTimeGenerator dateTimeGenerator;

    static DateTimeGenerator dateTimeGenerator() {
        return FixedDateTimeGenerator.onDay("2026-11-21");
    }

    @Test
    void pingImplementsTheContract() throws Exception {
        mvc.perform(get("/api/v1/ping")).andExpect(status().isOk()).andExpect(matchesContract())
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.time").value("2026-11-21T12:00:00+01:00"));
    }

    @Test
    void servesTheContractFile() throws Exception {
        mvc.perform(get("/api/v1/openapi.yaml")).andExpect(status().isOk())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.content()
                        .string(containsString("operationId: ping")));
    }

    @Test
    void servesSwaggerUi() throws Exception {
        mvc.perform(get("/swagger-ui/index.html")).andExpect(status().isOk());
    }

    @Test
    void swaggerUiLoadsTheSpecFromTheApiPath() throws Exception {
        mvc.perform(get("/v3/api-docs/swagger-config")).andExpect(status().isOk())
                .andExpect(jsonPath("$.url").value("/api/v1/openapi.yaml"));
    }

    @Test
    void doesNotPublishASecondSpecGeneratedFromCode() throws Exception {
        mvc.perform(get("/v3/api-docs")).andExpect(status().isOk()).andExpect(jsonPath("$.paths").isEmpty());
    }

    @Test
    void allowsFrontendOriginForApi() throws Exception {
        mvc.perform(options("/api/v1/ping").header(HttpHeaders.ORIGIN, FRONTEND)
                .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "GET")).andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, FRONTEND));
    }

    @Test
    void rejectsUnknownOrigin() throws Exception {
        mvc.perform(options("/api/v1/ping").header(HttpHeaders.ORIGIN, "https://evil.example")
                .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "GET")).andExpect(status().isForbidden());
    }
}
