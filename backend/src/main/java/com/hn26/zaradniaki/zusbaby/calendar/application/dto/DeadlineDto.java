package com.hn26.zaradniaki.zusbaby.calendar.application.dto;

import com.hn26.zaradniaki.zusbaby.calendar.api.model.DeadlineType;
import java.time.LocalDate;

/**
 * Calculated statutory deadline: {@code legal} is the last valid day,
 * {@code safe} the recommended day to act; {@code reason} explains why
 * {@code raw} is a day off ({@code null} for a working day).
 */
public record DeadlineDto(DeadlineType type, LocalDate raw, LocalDate legal, boolean shifted, String reason,
        LocalDate safe) {
}
