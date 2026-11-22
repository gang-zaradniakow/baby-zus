package com.hn26.zaradniaki.zusbaby.legalrules.api.exception;

import com.hn26.zaradniaki.zusbaby.shared.domain.NotFoundException;

/**
 * No parameter set is in force on the requested day (all versions start later).
 */
public class LegalParametersNotFoundException extends NotFoundException {

    public static final String CODE = "legal-parameters-not-found";

    public LegalParametersNotFoundException() {
        super(CODE, "Nie mamy jeszcze parametrów prawnych obowiązujących w tym dniu.");
    }
}
