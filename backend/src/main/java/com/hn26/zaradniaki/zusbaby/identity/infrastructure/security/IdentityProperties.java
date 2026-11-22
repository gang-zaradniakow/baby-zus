package com.hn26.zaradniaki.zusbaby.identity.infrastructure.security;

import java.time.Duration;
import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Login and token settings ({@code zusbaby.identity.*}).
 * @param jwtSecret HS256 key of the access tokens, at least 32 bytes
 * @param issuer {@code iss} of the access tokens
 * @param codeTtl validity of a login code
 * @param accessTokenTtl validity of an access token
 * @param refreshTokenTtl validity of a refresh token
 * @param allowedRedirectUris frontend addresses a login may return to
 */
@ConfigurationProperties("zusbaby.identity")
public record IdentityProperties(String jwtSecret, String issuer, Duration codeTtl, Duration accessTokenTtl,
        Duration refreshTokenTtl, List<String> allowedRedirectUris) {

    private static final int MIN_SECRET_BYTES = 32;

    public IdentityProperties {
        if (jwtSecret == null || jwtSecret.getBytes(java.nio.charset.StandardCharsets.UTF_8).length < MIN_SECRET_BYTES) {
            throw new IllegalStateException("zusbaby.identity.jwt-secret must have at least 32 bytes");
        }
        allowedRedirectUris = allowedRedirectUris == null ? List.of() : List.copyOf(allowedRedirectUris);
    }

    @Override
    public String toString() {
        return "IdentityProperties[issuer=%s, allowedRedirectUris=%s]".formatted(issuer, allowedRedirectUris);
    }
}
