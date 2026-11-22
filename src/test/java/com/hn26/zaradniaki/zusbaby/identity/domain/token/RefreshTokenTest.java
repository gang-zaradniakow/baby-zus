package com.hn26.zaradniaki.zusbaby.identity.domain.token;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class RefreshTokenTest {

    private static final Instant NOW = Instant.parse("2026-11-22T10:00:00Z");

    @Test
    void stopsWorkingWhenRevokedOrExpired() {
        RefreshToken token = RefreshToken.issue(UUID.randomUUID(), "hash", NOW.plus(Duration.ofDays(30)));

        assertThat(token.isActive(NOW)).isTrue();
        assertThat(token.isActive(NOW.plus(Duration.ofDays(30)))).isFalse();
        RefreshToken revoked = token.revoked(NOW);
        assertThat(revoked.isActive(NOW)).isFalse();
        // revoking again keeps the first moment
        assertThat(revoked.revoked(NOW.plusSeconds(5)).revokedAt()).isEqualTo(NOW);
    }
}
