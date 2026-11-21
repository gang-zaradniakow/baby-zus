package com.hn26.zaradniaki.zusbaby.calendar.domain;

import java.time.LocalDate;
import java.time.MonthDay;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Public holidays in Poland (act on days free from work), computed for any
 * year: fixed dates, the movable feasts derived from Easter
 * (Meeus/Jones/Butcher algorithm) and Christmas Eve, a day off since 2025.
 */
public final class PolishHolidays {

    static final int CHRISTMAS_EVE_FIRST_YEAR = 2025;

    private static final List<FixedHoliday> FIXED = List.of(
            new FixedHoliday(MonthDay.of(1, 1), "Nowy Rok"),
            new FixedHoliday(MonthDay.of(1, 6), "Trzech Króli"),
            new FixedHoliday(MonthDay.of(5, 1), "Święto Pracy"),
            new FixedHoliday(MonthDay.of(5, 3), "Święto Konstytucji 3 Maja"),
            new FixedHoliday(MonthDay.of(8, 15), "Wniebowzięcie NMP"),
            new FixedHoliday(MonthDay.of(11, 1), "Wszystkich Świętych"),
            new FixedHoliday(MonthDay.of(11, 11), "Narodowe Święto Niepodległości"),
            new FixedHoliday(MonthDay.of(12, 25), "Boże Narodzenie (1. dzień)"),
            new FixedHoliday(MonthDay.of(12, 26), "Boże Narodzenie (2. dzień)"));

    private final Map<Integer, Map<LocalDate, Holiday>> byYear = new ConcurrentHashMap<>();

    /** Holidays of the year in date order. */
    public List<Holiday> holidaysIn(int year) {
        return holidaysByDate(year).values().stream().sorted(Comparator.comparing(Holiday::date)).toList();
    }

    public Optional<Holiday> holidayOn(LocalDate day) {
        return Optional.ofNullable(holidaysByDate(day.getYear()).get(day));
    }

    private Map<LocalDate, Holiday> holidaysByDate(int year) {
        return byYear.computeIfAbsent(year, PolishHolidays::compute);
    }

    private static Map<LocalDate, Holiday> compute(int year) {
        List<Holiday> holidays = new ArrayList<>();
        FIXED.forEach(fixed -> holidays.add(new Holiday(fixed.day().atYear(year), fixed.name())));
        LocalDate easter = easterSunday(year);
        holidays.add(new Holiday(easter, "Wielkanoc"));
        holidays.add(new Holiday(easter.plusDays(1), "Poniedziałek Wielkanocny"));
        holidays.add(new Holiday(easter.plusDays(49), "Zielone Świątki"));
        holidays.add(new Holiday(easter.plusDays(60), "Boże Ciało"));
        if (year >= CHRISTMAS_EVE_FIRST_YEAR) {
            holidays.add(new Holiday(LocalDate.of(year, 12, 24), "Wigilia (od 2025 r.)"));
        }
        Map<LocalDate, Holiday> map = new ConcurrentHashMap<>();
        holidays.forEach(holiday -> map.put(holiday.date(), holiday));
        return Map.copyOf(map);
    }

    /** Gregorian Easter Sunday (Meeus/Jones/Butcher). */
    static LocalDate easterSunday(int year) {
        int a = year % 19;
        int b = year / 100;
        int c = year % 100;
        int d = b / 4;
        int e = b % 4;
        int f = (b + 8) / 25;
        int g = (b - f + 1) / 3;
        int h = (19 * a + b - d - g + 15) % 30;
        int i = c / 4;
        int k = c % 4;
        int l = (32 + 2 * e + 2 * i - h - k) % 7;
        int m = (a + 11 * h + 22 * l) / 451;
        int month = (h + l - 7 * m + 114) / 31;
        int day = (h + l - 7 * m + 114) % 31 + 1;
        return LocalDate.of(year, month, day);
    }

    private record FixedHoliday(MonthDay day, String name) {
    }
}
