package com.hn26.zaradniaki.zusbaby.identity.domain.token;

import java.time.Duration;

/**
 * Tokens given to the client after a login or a refresh.
 * @param accessToken signed JWT
 * @param accessTokenTtl validity of the access token
 * @param refreshToken secret refresh token
 * @param refreshTokenTtl validity of the refresh token
 */
public record IssuedTokens(String accessToken, Duration accessTokenTtl, String refreshToken,
        Duration refreshTokenTtl) {

    @Override
    public String toString() {
        return "IssuedTokens[***]";
    }
}
