package com.hn26.zaradniaki.zusbaby.identity.domain;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;
import java.util.Set;
import org.junit.jupiter.api.Test;

class LoginSettingsTest {

    @Test
    void allowsOnlyListedAddresses() {
        var settings = new LoginSettings(Duration.ofMinutes(2), Duration.ofMinutes(15), Duration.ofDays(30),
                Set.of("http://localhost:8765/"));

        assertThat(settings.allows("http://localhost:8765/")).isTrue();
        assertThat(settings.allows("http://localhost:8765")).isFalse();
    }
}
