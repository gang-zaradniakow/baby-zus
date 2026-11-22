package com.hn26.zaradniaki.zusbaby.identity.domain;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class SecretTokenTest {

    @Test
    void secretTokensAreRandomAndOnlyTheirHashIsKept() {
        SecretToken first = SecretToken.generate();
        SecretToken second = SecretToken.generate();

        assertThat(first.value()).isNotEqualTo(second.value()).hasSizeGreaterThanOrEqualTo(43);
        assertThat(first.hash()).isEqualTo(SecretToken.hashOf(first.value())).hasSize(64)
                .doesNotContain(first.value());
        assertThat(first.toString()).doesNotContain(first.value());
    }
}
