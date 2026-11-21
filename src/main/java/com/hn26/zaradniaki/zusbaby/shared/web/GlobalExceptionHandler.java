package com.hn26.zaradniaki.zusbaby.shared.web;

import com.hn26.zaradniaki.zusbaby.shared.domain.DomainException;
import com.hn26.zaradniaki.zusbaby.shared.domain.NotFoundException;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

/**
 * Turns every error into an RFC 9457 {@link ProblemDetail} with two extra
 * properties: {@code code} (stable, for the frontend) and {@code gentleMessage}
 * (Polish text that can be shown to the user as is).
 */
@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    public static final String CODE = "code";
    public static final String GENTLE_MESSAGE = "gentleMessage";

    static final String VALIDATION_CODE = "validation-failed";
    static final String VALIDATION_MESSAGE = "Wygląda na to, że część danych jest niepełna lub niepoprawna. Sprawdź je i spróbuj jeszcze raz.";
    static final String BAD_REQUEST_CODE = "bad-request";
    static final String NOT_FOUND_CODE = "not-found";
    static final String NOT_FOUND_MESSAGE = "Nie znaleźliśmy tego, czego szukasz.";
    static final String UNEXPECTED_CODE = "unexpected-error";
    static final String UNEXPECTED_MESSAGE = "Coś poszło nie tak po naszej stronie. Spróbuj ponownie za chwilę.";

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(NotFoundException.class)
    ProblemDetail handleNotFound(NotFoundException ex) {
        return problem(HttpStatus.NOT_FOUND, ex.code(), ex.gentleMessage());
    }

    @ExceptionHandler(DomainException.class)
    ProblemDetail handleDomain(DomainException ex) {
        return problem(HttpStatus.UNPROCESSABLE_CONTENT, ex.code(), ex.gentleMessage());
    }

    @ExceptionHandler(Exception.class)
    ProblemDetail handleUnexpected(Exception ex) {
        log.error("Unhandled exception", ex);
        return problem(HttpStatus.INTERNAL_SERVER_ERROR, UNEXPECTED_CODE, UNEXPECTED_MESSAGE);
    }

    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(MethodArgumentNotValidException ex,
            HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        ProblemDetail body = ex.getBody();
        body.setProperty(CODE, VALIDATION_CODE);
        body.setProperty(GENTLE_MESSAGE, VALIDATION_MESSAGE);
        body.setProperty("errors", ex.getBindingResult().getFieldErrors().stream()
                .map(error -> Map.of("field", error.getField(), "message", String.valueOf(error.getDefaultMessage())))
                .toList());
        return handleExceptionInternal(ex, body, headers, status, request);
    }

    /**
     * Other Spring MVC errors (bad JSON, wrong method...) keep their status but get
     * the same extra properties.
     */
    @Override
    protected ResponseEntity<Object> createResponseEntity(Object body, HttpHeaders headers, HttpStatusCode statusCode,
            WebRequest request) {
        if (body instanceof ProblemDetail problem && problem.getProperties() == null) {
            if (statusCode.value() == HttpStatus.NOT_FOUND.value()) {
                problem.setProperty(CODE, NOT_FOUND_CODE);
                problem.setProperty(GENTLE_MESSAGE, NOT_FOUND_MESSAGE);
            } else if (statusCode.is4xxClientError()) {
                problem.setProperty(CODE, BAD_REQUEST_CODE);
                problem.setProperty(GENTLE_MESSAGE, VALIDATION_MESSAGE);
            } else {
                problem.setProperty(CODE, UNEXPECTED_CODE);
                problem.setProperty(GENTLE_MESSAGE, UNEXPECTED_MESSAGE);
            }
        }
        return super.createResponseEntity(body, headers, statusCode, request);
    }

    private static ProblemDetail problem(HttpStatus status, String code, String gentleMessage) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(status, gentleMessage);
        problem.setProperty(CODE, code);
        problem.setProperty(GENTLE_MESSAGE, gentleMessage);
        return problem;
    }
}
