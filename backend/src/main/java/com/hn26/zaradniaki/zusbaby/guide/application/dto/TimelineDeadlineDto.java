package com.hn26.zaradniaki.zusbaby.guide.application.dto;

import com.hn26.zaradniaki.zusbaby.calendar.api.model.DeadlineType;
import java.time.LocalDate;

public record TimelineDeadlineDto(DeadlineType type, LocalDate raw, LocalDate legal, boolean shifted, String reason,
        LocalDate safe) {
}
