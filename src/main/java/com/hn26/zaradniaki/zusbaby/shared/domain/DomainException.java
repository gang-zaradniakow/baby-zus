package com.hn26.zaradniaki.zusbaby.shared.domain;

import java.util.Objects;

/**
 * Broken business rule. Carries a stable machine-readable {@code code} for the
 * frontend and a {@code gentleMessage}: a calm, plain-language explanation in
 * Polish that can be shown to a tired parent as is. The exception message is
 * for logs only.
 */
public class DomainException extends RuntimeException {

    private final String code;
    private final String gentleMessage;

    public DomainException(String code, String gentleMessage) {
        this(code, gentleMessage, gentleMessage);
    }

    public DomainException(String code, String gentleMessage, String logMessage) {
        super(logMessage);
        this.code = Objects.requireNonNull(code, "code");
        this.gentleMessage = Objects.requireNonNull(gentleMessage, "gentleMessage");
    }

    public String code() {
        return code;
    }

    public String gentleMessage() {
        return gentleMessage;
    }
}
