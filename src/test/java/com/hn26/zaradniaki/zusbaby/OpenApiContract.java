package com.hn26.zaradniaki.zusbaby;

import com.atlassian.oai.validator.OpenApiInteractionValidator;
import com.atlassian.oai.validator.mockmvc.OpenApiValidationMatchers;
import org.springframework.test.web.servlet.ResultMatcher;

/**
 * Checks that a MockMvc request and its response match
 * {@code openapi/openapi.yaml}. Use in every API integration test:
 * {@code mockMvc.perform(...).andExpect(OpenApiContract.matchesContract())}.
 */
public final class OpenApiContract {

    public static final String SPEC = "openapi/openapi.yaml";

    /** Parsed once; parsing the spec is the slow part. */
    private static final OpenApiInteractionValidator VALIDATOR = OpenApiInteractionValidator.createFor(SPEC).build();

    private OpenApiContract() {
    }

    public static ResultMatcher matchesContract() {
        return OpenApiValidationMatchers.openApi().isValid(VALIDATOR);
    }
}
