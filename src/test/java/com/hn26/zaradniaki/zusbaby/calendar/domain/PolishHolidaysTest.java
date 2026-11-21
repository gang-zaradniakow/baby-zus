package com.hn26.zaradniaki.zusbaby.calendar.domain;

import static org.assertj.core.api.Assertions.assertThat;

import com.hn26.zaradniaki.zusbaby.golden.GoldenCase;
import com.hn26.zaradniaki.zusbaby.golden.GoldenCases;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.MethodSource;

class PolishHolidaysTest {

    record Input(int year) {
    }

    record Expected(List<Holiday> holidays) {
    }

    private final PolishHolidays holidays = new PolishHolidays();

    /** Holidays listed by the frontend prototype (golden/holidays.json). */
    static Stream<GoldenCase<Input, Expected>> mockupCases() {
        return GoldenCases.load("holidays", Input.class, Expected.class);
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("mockupCases")
    void knowsHolidaysLikeTheMockup(GoldenCase<Input, Expected> golden) {
        assertThat(holidays.holidaysIn(golden.input().year())).isEqualTo(golden.expected().holidays());
    }

    @Test
    void christmasEveIsAWorkingDayBefore2025() {
        assertThat(holidays.holidayOn(LocalDate.of(2024, 12, 24))).isEmpty();
        assertThat(holidays.holidayOn(LocalDate.of(2025, 12, 24))).isPresent();
    }

    @ParameterizedTest
    @CsvSource({"2024, 2024-03-31", "2025, 2025-04-20", "2026, 2026-04-05", "2030, 2030-04-21", "2038, 2038-04-25",
            "2285, 2285-03-22"})
    void computesEasterSunday(int year, LocalDate easter) {
        assertThat(PolishHolidays.easterSunday(year)).isEqualTo(easter);
    }

    @Test
    void ordinaryDayIsNotAHoliday() {
        assertThat(holidays.holidayOn(LocalDate.of(2026, 11, 23))).isEmpty();
    }
}
