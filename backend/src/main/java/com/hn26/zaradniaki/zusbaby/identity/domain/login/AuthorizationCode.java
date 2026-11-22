package com.hn26.zaradniaki.zusbaby.identity.domain.login;

import com.hn26.zaradniaki.zusbaby.identity.domain.account.Identity;
import java.time.Instant;
import java.util.Objects;

/**
 * One-time login code issued after the mock mObywatel login.
 * @param codeHash hash of the code given to the browser
 * @param identity who logged in
 * @param redirectUri where the code was sent; it must be repeated when the code
 *            is exchanged
 * @param expiresAt end of validity
 */
public record AuthorizationCode(String codeHash, Identity identity, String redirectUri, Instant expiresAt) {

    public AuthorizationCode {
        Objects.requireNonNull(codeHash, "codeHash");
        Objects.requireNonNull(identity, "identity");
        Objects.requireNonNull(redirectUri, "redirectUri");
        Objects.requireNonNull(expiresAt, "expiresAt");
    }

    public boolean isValidFor(String redirect, Instant now) {
        return redirectUri.equals(redirect) && now.isBefore(expiresAt);
    }
}
