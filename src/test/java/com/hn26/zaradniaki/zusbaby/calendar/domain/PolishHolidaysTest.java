package com.hn26.zaradniaki.zusbaby.calendar.domain;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

class PolishHolidaysTest {

    private final PolishHolidays holidays = new PolishHolidays();

    /**
     * Holidays 2025–2027 as listed by the frontend prototype ({@code holidays()} in
     * {@code js/calc.js}).
     */
    @ParameterizedTest(name = "{0} {1}")
    @CsvSource({
            "2025-01-01, Nowy Rok",
            "2025-01-06, Trzech Króli",
            "2025-04-20, Wielkanoc",
            "2025-04-21, Poniedziałek Wielkanocny",
            "2025-05-01, Święto Pracy",
            "2025-05-03, Święto Konstytucji 3 Maja",
            "2025-06-08, Zielone Świątki",
            "2025-06-19, Boże Ciało",
            "2025-08-15, Wniebowzięcie NMP",
            "2025-11-01, Wszystkich Świętych",
            "2025-11-11, Narodowe Święto Niepodległości",
            "2025-12-24, Wigilia (od 2025 r.)",
            "2025-12-25, Boże Narodzenie (1. dzień)",
            "2025-12-26, Boże Narodzenie (2. dzień)",
            "2026-01-01, Nowy Rok",
            "2026-01-06, Trzech Króli",
            "2026-04-05, Wielkanoc",
            "2026-04-06, Poniedziałek Wielkanocny",
            "2026-05-01, Święto Pracy",
            "2026-05-03, Święto Konstytucji 3 Maja",
            "2026-05-24, Zielone Świątki",
            "2026-06-04, Boże Ciało",
            "2026-08-15, Wniebowzięcie NMP",
            "2026-11-01, Wszystkich Świętych",
            "2026-11-11, Narodowe Święto Niepodległości",
            "2026-12-24, Wigilia (od 2025 r.)",
            "2026-12-25, Boże Narodzenie (1. dzień)",
            "2026-12-26, Boże Narodzenie (2. dzień)",
            "2027-01-01, Nowy Rok",
            "2027-01-06, Trzech Króli",
            "2027-03-28, Wielkanoc",
            "2027-03-29, Poniedziałek Wielkanocny",
            "2027-05-01, Święto Pracy",
            "2027-05-03, Święto Konstytucji 3 Maja",
            "2027-05-16, Zielone Świątki",
            "2027-05-27, Boże Ciało",
            "2027-08-15, Wniebowzięcie NMP",
            "2027-11-01, Wszystkich Świętych",
            "2027-11-11, Narodowe Święto Niepodległości",
            "2027-12-24, Wigilia (od 2025 r.)",
            "2027-12-25, Boże Narodzenie (1. dzień)",
            "2027-12-26, Boże Narodzenie (2. dzień)"})
    void knowsHolidaysLikeTheMockup(LocalDate day, String name) {
        assertThat(holidays.holidayOn(day)).hasValueSatisfying(holiday -> assertThat(holiday.name()).isEqualTo(name));
    }

    @Test
    void listsFourteenHolidaysPerYearSinceChristmasEveIsFree() {
        assertThat(holidays.holidaysIn(2026)).hasSize(14).isSortedAccordingTo(
                (a, b) -> a.date().compareTo(b.date()));
        assertThat(holidays.holidaysIn(2025)).hasSize(14);
    }

    @Test
    void christmasEveIsAWorkingDayBefore2025() {
        assertThat(holidays.holidayOn(LocalDate.of(2024, 12, 24))).isEmpty();
        assertThat(holidays.holidaysIn(2024)).hasSize(13);
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
