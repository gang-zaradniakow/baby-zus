package com.hn26.zaradniaki.zusbaby.identity.application.dto;

/**
 * @param expiresIn seconds until the access token expires
 * @param refreshExpiresIn seconds until the refresh token expires
 */
public record IssuedTokensDto(String accessToken, long expiresIn, String refreshToken, long refreshExpiresIn) {

    @Override
    public String toString() {
        return "IssuedTokensDto[***]";
    }
}
