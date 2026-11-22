package com.hn26.zaradniaki.zusbaby.identity.domain.login;

import com.hn26.zaradniaki.zusbaby.shared.domain.InvalidRequestException;

/** The login would return to an address that is not on the configured list. */
public class RedirectNotAllowedException extends InvalidRequestException {

    public static final String CODE = "redirect-not-allowed";

    public RedirectNotAllowedException() {
        super(CODE, "Nie możemy zakończyć logowania pod tym adresem. Otwórz aplikację i zaloguj się jeszcze raz.");
    }
}
