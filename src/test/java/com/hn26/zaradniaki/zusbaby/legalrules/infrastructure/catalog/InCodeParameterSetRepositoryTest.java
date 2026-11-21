package com.hn26.zaradniaki.zusbaby.legalrules.infrastructure.catalog;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatIllegalStateException;

import com.hn26.zaradniaki.zusbaby.legalrules.api.model.ParameterKey;
import com.hn26.zaradniaki.zusbaby.legalrules.domain.LegalParametersFixtures;
import com.hn26.zaradniaki.zusbaby.legalrules.domain.ParameterSet;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

class InCodeParameterSetRepositoryTest {

    private static final ParameterSet V1 = ParameterSet.of(1, LocalDate.of(2026, 1, 1), "2026",
            LegalParametersFixtures.defaults());
    private static final ParameterSet V2 = ParameterSet.of(2, LocalDate.of(2027, 1, 1), "2027",
            LegalParametersFixtures.withOverrides(Map.of(ParameterKey.MINIMUM_WAGE, "5100")));

    private final InCodeParameterSetRepository repository = new InCodeParameterSetRepository(List.of(V2, V1));

    @Test
    void returnsNewestVersionThatHasStarted() {
        assertThat(repository.findEffectiveOn(LocalDate.of(2026, 1, 1))).contains(V1);
        assertThat(repository.findEffectiveOn(LocalDate.of(2026, 12, 31))).contains(V1);
        assertThat(repository.findEffectiveOn(LocalDate.of(2027, 1, 1))).contains(V2);
    }

    @Test
    void returnsNothingBeforeTheFirstVersion() {
        assertThat(repository.findEffectiveOn(LocalDate.of(2025, 12, 31))).isEmpty();
    }

    @Test
    void rejectsDuplicateVersions() {
        var duplicate = ParameterSet.of(1, LocalDate.of(2026, 6, 1), "again", LegalParametersFixtures.defaults());

        assertThatIllegalStateException().isThrownBy(() -> new InCodeParameterSetRepository(List.of(V1, duplicate)));
    }

    @Test
    void legalState2026MatchesTheFrontendPrototype() {
        var set = LegalState2026.parameterSet();

        assertThat(set.getVersion()).isEqualTo(1);
        assertThat(set.getValidFrom()).isEqualTo(LocalDate.of(2026, 1, 1));
        assertThat(set.getParameters()).isEqualTo(LegalParametersFixtures.defaults());
    }

    @Test
    void applicationUsesLegalState2026() {
        assertThat(new InCodeParameterSetRepository().findEffectiveOn(LocalDate.of(2026, 11, 21)))
                .contains(LegalState2026.parameterSet());
    }
}
