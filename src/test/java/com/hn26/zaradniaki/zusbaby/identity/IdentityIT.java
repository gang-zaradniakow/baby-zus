package com.hn26.zaradniaki.zusbaby.identity;

import static com.hn26.zaradniaki.zusbaby.OpenApiContract.matchesContract;
import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.hn26.zaradniaki.zusbaby.TestcontainersConfiguration;
import com.hn26.zaradniaki.zusbaby.shared.time.DateTimeGenerator;
import com.hn26.zaradniaki.zusbaby.shared.time.FixedDateTimeGenerator;
import java.time.Duration;
import java.time.Instant;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.convention.TestBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.util.UriComponentsBuilder;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/**
 * The whole mock mObywatel flow: authorize → login page → code → tokens →
 * {@code /me}, refresh and logout.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class IdentityIT {

    private static final String FRONTEND = "http://localhost:8765/";
    private static final Instant START = Instant.parse("2026-11-22T10:00:00Z");

    @Autowired
    private MockMvc mvc;

    @Autowired
    private JsonMapper json;

    @TestBean
    private DateTimeGenerator dateTimeGenerator;

    static DateTimeGenerator dateTimeGenerator() {
        return FixedDateTimeGenerator.at(START);
    }

    @BeforeEach
    void resetTime() {
        ((FixedDateTimeGenerator) dateTimeGenerator).setDay(START.atZone(dateTimeGenerator.zone()).toLocalDate());
    }

    @Test
    void authorizeRedirectsToTheMockLoginPage() throws Exception {
        String location = mvc
                .perform(get("/api/v1/auth/mobywatel/authorize").param("redirect_uri", FRONTEND).param("state",
                        "abc123"))
                .andExpect(status().isFound()).andExpect(matchesContract()).andReturn().getResponse()
                .getHeader(HttpHeaders.LOCATION);

        assertThat(location).startsWith("http://localhost/api/v1/mock/mobywatel/login?")
                .contains("state=abc123").contains("redirect_uri=http://localhost:8765/");
        mvc.perform(get("/api/v1/mock/mobywatel/login").param("redirect_uri", FRONTEND).param("state", "abc123"))
                .andExpect(status().isOk()).andExpect(content().string(containsString("Kasia — JDG, synek ma 16 dni")))
                .andExpect(content().string(containsString("Nowy użytkownik")));
    }

    @Test
    void refusesToReturnToAnUnknownAddress() throws Exception {
        mvc.perform(get("/api/v1/auth/mobywatel/authorize").param("redirect_uri", "https://evil.example/")
                .param("state", "abc")).andExpect(status().isBadRequest()).andExpect(matchesContract())
                .andExpect(jsonPath("$.code").value("redirect-not-allowed"));
        mvc.perform(post("/api/v1/mock/mobywatel/login").param("persona", "kasia")
                .param("redirect_uri", "https://evil.example/").param("state", "abc"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void needsState() throws Exception {
        mvc.perform(get("/api/v1/auth/mobywatel/authorize").param("redirect_uri", FRONTEND))
                .andExpect(status().isBadRequest());
    }

    @Test
    void personaLogsInAndSeesItselfAtMe() throws Exception {
        String code = loginAs("kasia", "xyz");

        JsonNode tokens = exchange(code);
        assertThat(tokens.get("expiresIn").asLong()).isEqualTo(900);
        assertThat(tokens.get("refreshExpiresIn").asLong()).isEqualTo(Duration.ofDays(30).toSeconds());
        mvc.perform(get("/api/v1/me").header(HttpHeaders.AUTHORIZATION, bearer(tokens)))
                .andExpect(status().isOk()).andExpect(matchesContract())
                .andExpect(jsonPath("$.personaId").value("kasia")).andExpect(jsonPath("$.displayName").value("Kasia"))
                .andExpect(jsonPath("$.roles[0]").value("USER"));
    }

    @Test
    void secondLoginOfThePersonaUsesTheSameAccount() throws Exception {
        String first = userId(exchange(loginAs("marek", "s1")));
        String second = userId(exchange(loginAs("marek", "s2")));

        assertThat(second).isEqualTo(first);
    }

    @Test
    void newUserHasNoPersona() throws Exception {
        JsonNode tokens = exchange(loginAs("new", "s"));

        mvc.perform(get("/api/v1/me").header(HttpHeaders.AUTHORIZATION, bearer(tokens)))
                .andExpect(status().isOk()).andExpect(matchesContract())
                .andExpect(jsonPath("$.personaId").doesNotExist()).andExpect(jsonPath("$.displayName").doesNotExist());
    }

    @Test
    void codeWorksOnlyOnce() throws Exception {
        String code = loginAs("ola", "s");
        exchange(code);

        rejectExchange(code, FRONTEND);
    }

    @Test
    void codeWorksOnlyForItsAddress() throws Exception {
        String code = loginAs("ola", "s");

        rejectExchange(code, "http://127.0.0.1:8765/");
        // a rejected code is used up as well
        rejectExchange(code, FRONTEND);
    }

    @Test
    void codeExpiresAfterTwoMinutes() throws Exception {
        String code = loginAs("ewa", "s");
        ((FixedDateTimeGenerator) dateTimeGenerator).advance(Duration.ofMinutes(2));

        rejectExchange(code, FRONTEND);
    }

    @Test
    void refreshRotatesTheTokenAndLogoutRevokesIt() throws Exception {
        JsonNode tokens = exchange(loginAs("zofia", "s"));
        String refresh = tokens.get("refreshToken").asString();

        JsonNode refreshed = json.readTree(mvc
                .perform(post("/api/v1/auth/refresh").contentType(MediaType.APPLICATION_JSON)
                        .content(refreshBody(refresh)))
                .andExpect(status().isOk()).andExpect(matchesContract()).andReturn().getResponse()
                .getContentAsString());
        assertThat(refreshed.get("refreshToken").asString()).isNotEqualTo(refresh);
        // the old refresh token stopped working
        mvc.perform(post("/api/v1/auth/refresh").contentType(MediaType.APPLICATION_JSON).content(refreshBody(refresh)))
                .andExpect(status().isBadRequest()).andExpect(matchesContract())
                .andExpect(jsonPath("$.code").value("invalid-grant"));

        String current = refreshed.get("refreshToken").asString();
        mvc.perform(post("/api/v1/auth/logout").contentType(MediaType.APPLICATION_JSON).content(refreshBody(current)))
                .andExpect(status().isNoContent()).andExpect(matchesContract());
        mvc.perform(post("/api/v1/auth/refresh").contentType(MediaType.APPLICATION_JSON).content(refreshBody(current)))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("invalid-grant"));
        // logging out again is fine
        mvc.perform(post("/api/v1/auth/logout").contentType(MediaType.APPLICATION_JSON).content(refreshBody(current)))
                .andExpect(status().isNoContent());
    }

    @Test
    void meNeedsAValidAccessToken() throws Exception {
        // no matchesContract(): the request breaks the contract on purpose (no bearer
        // token)
        mvc.perform(get("/api/v1/me")).andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("unauthorized"));
        mvc.perform(get("/api/v1/me").header(HttpHeaders.AUTHORIZATION, "Bearer not-a-jwt"))
                .andExpect(status().isUnauthorized()).andExpect(jsonPath("$.code").value("unauthorized"));
    }

    @Test
    void accessTokenExpiresAfterFifteenMinutes() throws Exception {
        JsonNode tokens = exchange(loginAs("anna", "s"));
        ((FixedDateTimeGenerator) dateTimeGenerator).advance(Duration.ofMinutes(17));

        mvc.perform(get("/api/v1/me").header(HttpHeaders.AUTHORIZATION, bearer(tokens)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void publicEndpointsStayPublic() throws Exception {
        mvc.perform(get("/api/v1/ping")).andExpect(status().isOk());
        mvc.perform(get("/api/v1/knowledge/chapters")).andExpect(status().isOk());
    }

    /**
     * Picks the persona on the mock page and returns the code sent back to the
     * frontend.
     */
    private String loginAs(String persona, String state) throws Exception {
        String location = mvc
                .perform(post("/api/v1/mock/mobywatel/login").param("persona", persona)
                        .param("redirect_uri", FRONTEND).param("state", state))
                .andExpect(status().is3xxRedirection()).andExpect(header().string(HttpHeaders.LOCATION,
                        containsString("state=" + state)))
                .andReturn().getResponse().getHeader(HttpHeaders.LOCATION);
        assertThat(location).startsWith(FRONTEND + "?");
        return UriComponentsBuilder.fromUriString(location).build().getQueryParams().getFirst("code");
    }

    private JsonNode exchange(String code) throws Exception {
        return json.readTree(mvc
                .perform(post("/api/v1/auth/token").contentType(MediaType.APPLICATION_JSON)
                        .content(tokenBody(code, FRONTEND)))
                .andExpect(status().isOk()).andExpect(matchesContract())
                .andExpect(jsonPath("$.tokenType").value("Bearer")).andReturn().getResponse().getContentAsString());
    }

    private void rejectExchange(String code, String redirectUri) throws Exception {
        mvc.perform(post("/api/v1/auth/token").contentType(MediaType.APPLICATION_JSON)
                .content(tokenBody(code, redirectUri))).andExpect(status().isBadRequest())
                .andExpect(matchesContract()).andExpect(jsonPath("$.code").value("invalid-grant"));
    }

    private String userId(JsonNode tokens) throws Exception {
        return json.readTree(mvc.perform(get("/api/v1/me").header(HttpHeaders.AUTHORIZATION, bearer(tokens)))
                .andReturn().getResponse().getContentAsString()).get("id").asString();
    }

    private static String bearer(JsonNode tokens) {
        return "Bearer " + tokens.get("accessToken").asString();
    }

    private String tokenBody(String code, String redirectUri) {
        return json.writeValueAsString(java.util.Map.of("code", code, "redirectUri", redirectUri));
    }

    private String refreshBody(String refresh) {
        return json.writeValueAsString(java.util.Map.of("refreshToken", refresh));
    }
}
