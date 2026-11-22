package com.hn26.zaradniaki.zusbaby.shared.domain;

/**
 * The request cannot be handled as sent (answered with 400), e.g. an expired
 * login code. Validation errors of the input use Bean Validation instead.
 */
public class InvalidRequestException extends DomainException {

    public InvalidRequestException(String code, String gentleMessage) {
        super(code, gentleMessage);
    }
}
