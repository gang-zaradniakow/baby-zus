package com.hn26.zaradniaki.zusbaby.calendar.domain;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

class WorkingDaysTest {

    private final WorkingDays workingDays = new WorkingDays(new PolishHolidays());

    @ParameterizedTest
    @CsvSource({"2026-11-21, sobota", "2026-11-22, niedziela", "2026-11-11, Narodowe Święto Niepodległości",
            "2026-05-03, Święto Konstytucji 3 Maja"})
    void explainsWhyADayIsFree(LocalDate day, String reason) {
        assertThat(workingDays.isDayOff(day)).isTrue();
        assertThat(workingDays.dayOffReason(day)).contains(reason);
    }

    @Test
    void holidayNameWinsOverWeekend() {
        // 3 May 2026 is a Sunday
        assertThat(workingDays.dayOffReason(LocalDate.of(2026, 5, 3))).contains("Święto Konstytucji 3 Maja");
    }

    @Test
    void weekdayIsAWorkingDay() {
        assertThat(workingDays.isDayOff(LocalDate.of(2026, 11, 23))).isFalse();
        assertThat(workingDays.dayOffReason(LocalDate.of(2026, 11, 23))).isEmpty();
    }

    @Test
    void findsNearestWorkingDays() {
        // Christmas 2026: Thu 24 (Wigilia), Fri 25, Sat 26 (holiday), Sun 27
        assertThat(workingDays.onOrAfter(LocalDate.of(2026, 12, 24))).isEqualTo(LocalDate.of(2026, 12, 28));
        assertThat(workingDays.onOrBefore(LocalDate.of(2026, 12, 27))).isEqualTo(LocalDate.of(2026, 12, 23));
        assertThat(workingDays.onOrAfter(LocalDate.of(2026, 11, 23))).isEqualTo(LocalDate.of(2026, 11, 23));
    }
}
