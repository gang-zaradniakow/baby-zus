package com.hn26.zaradniaki.zusbaby.identity.domain;

import java.time.Duration;
import java.util.Objects;
import java.util.Set;

/**
 * Configured rules of the login.
 * @param codeTtl validity of a login code
 * @param accessTokenTtl validity of an access token
 * @param refreshTokenTtl validity of a refresh token
 * @param allowedRedirectUris addresses of the frontend a login may return to
 *            (exact match)
 */
public record LoginSettings(Duration codeTtl, Duration accessTokenTtl, Duration refreshTokenTtl,
        Set<String> allowedRedirectUris) {

    public LoginSettings {
        Objects.requireNonNull(codeTtl, "codeTtl");
        Objects.requireNonNull(accessTokenTtl, "accessTokenTtl");
        Objects.requireNonNull(refreshTokenTtl, "refreshTokenTtl");
        allowedRedirectUris = Set.copyOf(allowedRedirectUris);
    }

    public boolean allows(String redirectUri) {
        return allowedRedirectUris.contains(redirectUri);
    }
}
