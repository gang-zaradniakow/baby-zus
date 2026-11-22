package com.hn26.zaradniaki.zusbaby.identity.infrastructure.mobywatel;

import com.hn26.zaradniaki.zusbaby.identity.domain.account.Identity;

/**
 * Demo person of the mock mObywatel (personas of the frontend prototype).
 * @param id persona identifier, also used by the mock eZUS
 * @param givenName first name
 * @param label what the login page shows
 * @param description scenario of the persona
 * @param pesel fictional PESEL (valid control digit, not a real person's)
 */
record MockPersona(String id, String givenName, String label, String description, String pesel) {

    Identity identity() {
        return new Identity(pesel, id, givenName);
    }
}
