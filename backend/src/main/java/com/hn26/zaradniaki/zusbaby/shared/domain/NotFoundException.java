package com.hn26.zaradniaki.zusbaby.shared.domain;

/** Requested resource does not exist (or is not visible to the caller). */
public class NotFoundException extends DomainException {

    public NotFoundException(String code, String gentleMessage) {
        super(code, gentleMessage);
    }
}
