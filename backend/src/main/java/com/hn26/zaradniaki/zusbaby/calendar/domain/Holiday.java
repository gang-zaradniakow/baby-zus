package com.hn26.zaradniaki.zusbaby.calendar.domain;

import java.time.LocalDate;
import java.util.Objects;

/** Statutory public holiday (day free from work) with its Polish name. */
public record Holiday(LocalDate date, String name) {

    public Holiday {
        Objects.requireNonNull(date, "date");
        Objects.requireNonNull(name, "name");
    }
}
