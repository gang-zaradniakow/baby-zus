package com.hn26.zaradniaki.zusbaby.identity.domain.login;

import static org.assertj.core.api.Assertions.assertThat;

import com.hn26.zaradniaki.zusbaby.identity.domain.account.Identity;
import java.time.Instant;
import org.junit.jupiter.api.Test;

class AuthorizationCodeTest {

    private static final Instant NOW = Instant.parse("2026-11-22T10:00:00Z");

    @Test
    void isValidOnlyForItsAddressAndBeforeItExpires() {
        var code = new AuthorizationCode("hash", new Identity("93090312304", "kasia", "Kasia"),
                "http://localhost:8765/", NOW.plusSeconds(120));

        assertThat(code.isValidFor("http://localhost:8765/", NOW)).isTrue();
        assertThat(code.isValidFor("http://evil.example/", NOW)).isFalse();
        assertThat(code.isValidFor("http://localhost:8765/", NOW.plusSeconds(120))).isFalse();
    }
}
