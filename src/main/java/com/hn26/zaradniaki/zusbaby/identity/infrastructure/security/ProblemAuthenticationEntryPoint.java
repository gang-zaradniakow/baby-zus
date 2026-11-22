package com.hn26.zaradniaki.zusbaby.identity.infrastructure.security;

import com.hn26.zaradniaki.zusbaby.shared.web.GlobalExceptionHandler;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import tools.jackson.databind.json.JsonMapper;

/**
 * Missing, invalid or expired access token: 401 with the same problem body as
 * every other error.
 */
@RequiredArgsConstructor
class ProblemAuthenticationEntryPoint implements AuthenticationEntryPoint {

    static final String CODE = "unauthorized";
    static final String MESSAGE = "Twoja sesja wygasła albo nie jesteś zalogowana(-y). Zaloguj się, aby zobaczyć swoje dane.";

    private final JsonMapper jsonMapper;

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response, AuthenticationException exception)
            throws IOException {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.UNAUTHORIZED, MESSAGE);
        problem.setProperty(GlobalExceptionHandler.CODE, CODE);
        problem.setProperty(GlobalExceptionHandler.GENTLE_MESSAGE, MESSAGE);
        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        response.setHeader("WWW-Authenticate", "Bearer");
        response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
        jsonMapper.writeValue(response.getOutputStream(), problem);
    }
}
