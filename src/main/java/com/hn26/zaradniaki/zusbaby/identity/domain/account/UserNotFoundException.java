package com.hn26.zaradniaki.zusbaby.identity.domain.account;

import com.hn26.zaradniaki.zusbaby.shared.domain.NotFoundException;

/** The account of a token no longer exists. */
public class UserNotFoundException extends NotFoundException {

    public static final String CODE = "user-not-found";

    public UserNotFoundException() {
        super(CODE, "Nie znaleźliśmy Twojego konta. Zaloguj się jeszcze raz.");
    }
}
