package com.hn26.zaradniaki.zusbaby.shared.web;

import static org.assertj.core.api.Assertions.assertThat;

import com.hn26.zaradniaki.zusbaby.shared.domain.DomainException;
import com.hn26.zaradniaki.zusbaby.shared.domain.NotFoundException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.assertj.MockMvcTester;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@WebMvcTest(controllers = GlobalExceptionHandlerTest.FailingController.class)
@Import(GlobalExceptionHandlerTest.FailingController.class)
class GlobalExceptionHandlerTest {

    @Autowired
    private MockMvcTester mvc;

    @Test
    void mapsDomainExceptionTo422WithGentleMessage() {
        assertThat(mvc.get().uri("/test/domain")).hasStatus(HttpStatus.UNPROCESSABLE_CONTENT).bodyJson()
                .hasPathSatisfying("$.code", code -> code.assertThat().isEqualTo("debt-blocks-benefit"))
                .hasPathSatisfying("$.gentleMessage",
                        message -> message.assertThat().isEqualTo("Zaległość w składkach wstrzymuje zasiłek."))
                .hasPathSatisfying("$.status", status -> status.assertThat().isEqualTo(422));
    }

    @Test
    void mapsNotFoundTo404() {
        assertThat(mvc.get().uri("/test/missing")).hasStatus(HttpStatus.NOT_FOUND).bodyJson()
                .hasPathSatisfying("$.code", code -> code.assertThat().isEqualTo("child-not-found"));
    }

    @Test
    void hidesDetailsOfUnexpectedErrors() {
        assertThat(mvc.get().uri("/test/crash")).hasStatus(HttpStatus.INTERNAL_SERVER_ERROR).bodyJson()
                .hasPathSatisfying("$.code", code -> code.assertThat().isEqualTo("unexpected-error"))
                .hasPathSatisfying("$.detail", detail -> detail.assertThat().asString().doesNotContain("secret"));
    }

    @Test
    void listsInvalidFields() {
        assertThat(mvc.post().uri("/test/validate").contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"\"}"))
                .hasStatus(HttpStatus.BAD_REQUEST).bodyJson()
                .hasPathSatisfying("$.code", code -> code.assertThat().isEqualTo("validation-failed"))
                .hasPathSatisfying("$.gentleMessage", message -> message.assertThat().isNotNull())
                .hasPathSatisfying("$.errors[0].field", field -> field.assertThat().isEqualTo("name"));
    }

    @Test
    void addsGentleMessageToUnknownPath() {
        assertThat(mvc.get().uri("/test/no-such-path")).hasStatus(HttpStatus.NOT_FOUND).bodyJson()
                .hasPathSatisfying("$.code", code -> code.assertThat().isEqualTo("not-found"))
                .hasPathSatisfying("$.gentleMessage", message -> message.assertThat().isNotNull());
    }

    @Test
    void addsGentleMessageToMalformedJson() {
        assertThat(mvc.post().uri("/test/validate").contentType(MediaType.APPLICATION_JSON).content("{not json"))
                .hasStatus(HttpStatus.BAD_REQUEST).bodyJson()
                .hasPathSatisfying("$.code", code -> code.assertThat().isEqualTo("bad-request"))
                .hasPathSatisfying("$.gentleMessage", message -> message.assertThat().isNotNull());
    }

    record NameRequest(@NotBlank String name) {
    }

    @RestController
    static class FailingController {

        @GetMapping("/test/domain")
        void domain() {
            throw new DomainException("debt-blocks-benefit", "Zaległość w składkach wstrzymuje zasiłek.");
        }

        @GetMapping("/test/missing")
        void missing() {
            throw new NotFoundException("child-not-found", "Nie znaleźliśmy tego profilu dziecka.");
        }

        @GetMapping("/test/crash")
        void crash() {
            throw new IllegalStateException("secret internal state");
        }

        @PostMapping("/test/validate")
        void validate(@Valid @RequestBody NameRequest request) {
        }
    }
}
