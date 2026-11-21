package com.hn26.zaradniaki.zusbaby.legalrules.domain;

import com.hn26.zaradniaki.zusbaby.shared.domain.DomainException;

/**
 * A parameter set is incomplete or a value does not fit its kind (e.g. a rate
 * above 1).
 */
public class InvalidLegalParametersException extends DomainException {

    public static final String CODE = "invalid-legal-parameters";

    public InvalidLegalParametersException(String gentleMessage) {
        super(CODE, gentleMessage);
    }
}
