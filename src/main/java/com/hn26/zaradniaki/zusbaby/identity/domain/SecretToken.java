package com.hn26.zaradniaki.zusbaby.identity.domain;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;

/**
 * Random secret given to the client (login code, refresh token). Only its
 * SHA-256 hash is stored, so a leaked database does not leak usable secrets.
 * @param value the secret, given to the client once
 * @param hash what is stored and looked up
 */
public record SecretToken(String value, String hash) {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final int BYTES = 32;

    public static SecretToken generate() {
        byte[] bytes = new byte[BYTES];
        RANDOM.nextBytes(bytes);
        String value = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        return new SecretToken(value, hashOf(value));
    }

    public static String hashOf(String value) {
        try {
            return HexFormat.of().formatHex(
                    MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 is always available", e);
        }
    }

    @Override
    public String toString() {
        return "SecretToken[***]";
    }
}
