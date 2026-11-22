package com.hn26.zaradniaki.zusbaby.identity.domain.login;

/**
 * Port: the identity provider (mock mObywatel now, Węzeł Krajowy later) where
 * the browser logs in.
 */
public interface IdentityProvider {

    /**
     * Path of the provider's login page, which returns to {@code redirectUri} with
     * a code and the unchanged {@code state}.
     */
    String loginPage(String redirectUri, String state);
}
