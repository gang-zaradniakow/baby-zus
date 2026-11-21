package com.hn26.zaradniaki.zusbaby.shared.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatIllegalArgumentException;

import org.junit.jupiter.api.Test;

class CheckTest {

    @Test
    void factoriesSetLevel() {
        assertThat(Check.ok("Okres wyczekiwania spełniony.").level()).isEqualTo(Check.Level.OK);
        assertThat(Check.info("Zasiłek wypłaca ZUS.").level()).isEqualTo(Check.Level.INFO);
        assertThat(Check.no("Zaległość blokuje zasiłek.").isNegative()).isTrue();
        assertThat(Check.ok("Tak.").isNegative()).isFalse();
    }

    @Test
    void requiresMessage() {
        assertThatIllegalArgumentException().isThrownBy(() -> Check.ok(" "));
        assertThatIllegalArgumentException().isThrownBy(() -> Check.no(null));
    }
}
