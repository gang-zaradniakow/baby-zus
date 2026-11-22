package com.hn26.zaradniaki.zusbaby.legalrules.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatIllegalArgumentException;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.LocalDate;
import org.junit.jupiter.api.Test;

class ParameterSetTest {

    private static final LocalDate VALID_FROM = LocalDate.of(2026, 1, 1);

    @Test
    void startsOnItsFirstDay() {
        var set = ParameterSet.of(1, VALID_FROM, "Stan prawny 2026", LegalParametersFixtures.defaults());

        assertThat(set.hasStartedOn(VALID_FROM)).isTrue();
        assertThat(set.hasStartedOn(VALID_FROM.plusMonths(10))).isTrue();
        assertThat(set.hasStartedOn(VALID_FROM.minusDays(1))).isFalse();
    }

    @Test
    void requiresDescriptionOfLegalBasis() {
        assertThatThrownBy(() -> ParameterSet.of(1, VALID_FROM, "  ", LegalParametersFixtures.defaults()))
                .isInstanceOf(InvalidLegalParametersException.class);
    }

    @Test
    void requiresPositiveVersion() {
        assertThatIllegalArgumentException()
                .isThrownBy(() -> ParameterSet.of(0, VALID_FROM, "Stan", LegalParametersFixtures.defaults()));
    }

    @Test
    void versionIdentifiesTheSet() {
        var first = ParameterSet.of(1, VALID_FROM, "A", LegalParametersFixtures.defaults());
        var same = ParameterSet.of(1, VALID_FROM.plusDays(1), "B", LegalParametersFixtures.defaults());

        assertThat(first).isEqualTo(same);
    }
}
