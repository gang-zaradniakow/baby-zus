package com.hn26.zaradniaki.zusbaby.identity.domain.token;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

/**
 * Long-lived token for new access tokens; rotated on every use.
 * @param id identifier
 * @param userId owner
 * @param tokenHash hash of the token given to the client
 * @param expiresAt end of validity
 * @param revokedAt when it was used or the user logged out, {@code null} while
 *            active
 */
public record RefreshToken(UUID id, UUID userId, String tokenHash, Instant expiresAt, Instant revokedAt) {

    public RefreshToken {
        Objects.requireNonNull(id, "id");
        Objects.requireNonNull(userId, "userId");
        Objects.requireNonNull(tokenHash, "tokenHash");
        Objects.requireNonNull(expiresAt, "expiresAt");
    }

    public static RefreshToken issue(UUID userId, String tokenHash, Instant expiresAt) {
        return new RefreshToken(UUID.randomUUID(), userId, tokenHash, expiresAt, null);
    }

    public boolean isActive(Instant now) {
        return revokedAt == null && now.isBefore(expiresAt);
    }

    public RefreshToken revoked(Instant now) {
        return revokedAt != null ? this : new RefreshToken(id, userId, tokenHash, expiresAt, now);
    }
}
