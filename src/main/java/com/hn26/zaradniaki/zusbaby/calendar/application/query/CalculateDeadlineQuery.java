package com.hn26.zaradniaki.zusbaby.calendar.application.query;

import an.awesome.pipelinr.Command;
import com.hn26.zaradniaki.zusbaby.calendar.api.model.DeadlineType;
import com.hn26.zaradniaki.zusbaby.calendar.application.dto.DeadlineDto;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.time.LocalDate;

/**
 * Statutory deadline counted from {@code event}: exactly one of {@code days} or
 * {@code months}; {@code BEFORE} accepts only {@code days}.
 */
public record CalculateDeadlineQuery(@NotNull LocalDate event, @NotNull DeadlineType type, @Positive Integer days,
        @Positive Integer months) implements Command<DeadlineDto> {

    @AssertTrue(message = "podaj dokładnie jedno: days albo months")
    boolean isExactlyOnePeriod() {
        return (days == null) != (months == null);
    }

    @AssertTrue(message = "termin „przed” liczy się tylko w dniach")
    boolean isBeforeCountedInDays() {
        return type != DeadlineType.BEFORE || months == null;
    }
}
