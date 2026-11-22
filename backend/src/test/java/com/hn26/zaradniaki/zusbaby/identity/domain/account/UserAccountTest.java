package com.hn26.zaradniaki.zusbaby.identity.domain.account;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatIllegalArgumentException;

import java.time.Instant;
import org.junit.jupiter.api.Test;

class UserAccountTest {

    private static final Instant NOW = Instant.parse("2026-11-22T10:00:00Z");
    private static final Identity KASIA = new Identity("93090312304", "kasia", "Kasia");

    @Test
    void firstLoginRegistersAUser() {
        UserAccount account = UserAccount.register(KASIA, NOW);

        assertThat(account.roles()).containsExactly(Role.USER);
        assertThat(account.identity()).isEqualTo(KASIA);
        assertThat(account.createdAt()).isEqualTo(NOW);
    }

    @Test
    void identityNeedsASubjectAndNeverPrintsIt() {
        assertThatIllegalArgumentException().isThrownBy(() -> new Identity(" ", null, null));
        assertThat(KASIA.toString()).doesNotContain("93090312304").contains("kasia");
    }
}
