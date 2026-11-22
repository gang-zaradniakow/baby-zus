package com.hn26.zaradniaki.zusbaby.identity.domain.account;

import java.util.Objects;

/**
 * Who logged in, as the identity provider (mock mObywatel) says.
 * @param subject stable identifier of the person (a fictional PESEL for the
 *            demo personas)
 * @param personaId demo persona, {@code null} for a new user
 * @param displayName first name, may be {@code null}
 */
public record Identity(String subject, String personaId, String displayName) {

    public Identity {
        if (subject == null || subject.isBlank()) {
            throw new IllegalArgumentException("Identity needs a subject");
        }
    }

    @Override
    public String toString() {
        // the subject may be a PESEL: never log it
        return "Identity[personaId=%s]".formatted(Objects.toString(personaId, "-"));
    }
}
