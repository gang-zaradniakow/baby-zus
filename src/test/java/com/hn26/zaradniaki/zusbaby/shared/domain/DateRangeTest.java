package com.hn26.zaradniaki.zusbaby.shared.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatIllegalArgumentException;

import java.time.LocalDate;
import org.junit.jupiter.api.Test;

class DateRangeTest {

    private static final LocalDate BIRTH = LocalDate.of(2026, 11, 5);

    @Test
    void includesBothEnds() {
        var range = new DateRange(BIRTH, BIRTH.plusDays(13));

        assertThat(range.lengthInDays()).isEqualTo(14);
        assertThat(range.contains(BIRTH)).isTrue();
        assertThat(range.contains(BIRTH.plusDays(13))).isTrue();
        assertThat(range.contains(BIRTH.plusDays(14))).isFalse();
        assertThat(range.contains(BIRTH.minusDays(1))).isFalse();
    }

    @Test
    void singleDayRangeIsAllowed() {
        assertThat(new DateRange(BIRTH, BIRTH).lengthInDays()).isEqualTo(1);
    }

    @Test
    void rejectsEndBeforeStart() {
        assertThatIllegalArgumentException().isThrownBy(() -> new DateRange(BIRTH, BIRTH.minusDays(1)));
    }

    @Test
    void buildsRangeFromLength() {
        // 20 weeks of maternity leave from the birth day
        var leave = DateRange.startingAt(BIRTH, Weeks.of(20));

        assertThat(leave.to()).isEqualTo(LocalDate.of(2027, 3, 24));
        assertThat(leave.nextDay()).isEqualTo(LocalDate.of(2027, 3, 25));
        assertThatIllegalArgumentException().isThrownBy(() -> DateRange.startingAt(BIRTH, 0));
    }

    @Test
    void detectsOverlap() {
        var maternity = DateRange.startingAt(BIRTH, 140);
        var paternity = DateRange.startingAt(BIRTH.plusDays(7), 14);
        var later = DateRange.startingAt(maternity.nextDay(), 7);

        assertThat(maternity.overlaps(paternity)).isTrue();
        assertThat(maternity.overlaps(later)).isFalse();
    }
}
