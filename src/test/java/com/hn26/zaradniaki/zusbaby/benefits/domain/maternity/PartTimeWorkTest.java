package com.hn26.zaradniaki.zusbaby.benefits.domain.maternity;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatIllegalArgumentException;

import com.hn26.zaradniaki.zusbaby.shared.domain.Rate;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class PartTimeWorkTest {

    @ParameterizedTest
    @ValueSource(strings = {"0.25", "0.5"})
    void allowsUpToHalfTime(String share) {
        assertThatCode(() -> new PartTimeWork(Parent.MOTHER, Rate.of(share), 8)).doesNotThrowAnyException();
    }

    @ParameterizedTest
    @ValueSource(strings = {"0", "0.75"})
    void rejectsNoWorkAndMoreThanHalfTime(String share) {
        assertThatIllegalArgumentException().isThrownBy(() -> new PartTimeWork(Parent.FATHER, Rate.of(share), 8));
    }

    @Test
    void rejectsNegativeWeeks() {
        assertThatIllegalArgumentException().isThrownBy(() -> new PartTimeWork(Parent.MOTHER, Rate.of("0.5"), -1));
    }
}
