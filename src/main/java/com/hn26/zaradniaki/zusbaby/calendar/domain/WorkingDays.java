package com.hn26.zaradniaki.zusbaby.calendar.domain;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.Objects;
import java.util.Optional;

/** Working days: every day except Saturdays, Sundays and public holidays. */
public final class WorkingDays {

    static final String SATURDAY = "sobota";
    static final String SUNDAY = "niedziela";

    private final PolishHolidays holidays;

    public WorkingDays(PolishHolidays holidays) {
        this.holidays = Objects.requireNonNull(holidays, "holidays");
    }

    public boolean isDayOff(LocalDate day) {
        return dayOffReason(day).isPresent();
    }

    /**
     * Why the day is free from work: holiday name first, otherwise {@code sobota} /
     * {@code niedziela}.
     */
    public Optional<String> dayOffReason(LocalDate day) {
        Optional<String> holiday = holidays.holidayOn(day).map(Holiday::name);
        if (holiday.isPresent()) {
            return holiday;
        }
        if (day.getDayOfWeek() == DayOfWeek.SATURDAY) {
            return Optional.of(SATURDAY);
        }
        if (day.getDayOfWeek() == DayOfWeek.SUNDAY) {
            return Optional.of(SUNDAY);
        }
        return Optional.empty();
    }

    /**
     * The day itself when it is a working day, otherwise the first working day
     * after it.
     */
    public LocalDate onOrAfter(LocalDate day) {
        LocalDate candidate = day;
        while (isDayOff(candidate)) {
            candidate = candidate.plusDays(1);
        }
        return candidate;
    }

    /**
     * The day itself when it is a working day, otherwise the last working day
     * before it.
     */
    public LocalDate onOrBefore(LocalDate day) {
        LocalDate candidate = day;
        while (isDayOff(candidate)) {
            candidate = candidate.minusDays(1);
        }
        return candidate;
    }
}
