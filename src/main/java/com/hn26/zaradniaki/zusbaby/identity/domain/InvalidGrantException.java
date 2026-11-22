package com.hn26.zaradniaki.zusbaby.identity.domain;

import com.hn26.zaradniaki.zusbaby.shared.domain.InvalidRequestException;

/**
 * Login code or refresh token unknown, used, expired or for another address.
 */
public class InvalidGrantException extends InvalidRequestException {

    public static final String CODE = "invalid-grant";

    public InvalidGrantException() {
        super(CODE, "Logowanie wygasło albo zostało już użyte. Zaloguj się jeszcze raz.");
    }
}
