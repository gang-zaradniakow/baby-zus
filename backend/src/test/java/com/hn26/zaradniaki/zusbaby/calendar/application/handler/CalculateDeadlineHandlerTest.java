package com.hn26.zaradniaki.zusbaby.calendar.application.handler;

import static org.assertj.core.api.Assertions.assertThat;

import com.hn26.zaradniaki.zusbaby.calendar.api.model.DeadlineType;
import com.hn26.zaradniaki.zusbaby.calendar.application.dto.DeadlineDto;
import com.hn26.zaradniaki.zusbaby.calendar.application.mapper.DeadlineDtoMapper;
import com.hn26.zaradniaki.zusbaby.calendar.application.query.CalculateDeadlineQuery;
import com.hn26.zaradniaki.zusbaby.calendar.domain.DeadlinePolicy;
import com.hn26.zaradniaki.zusbaby.calendar.domain.PolishHolidays;
import com.hn26.zaradniaki.zusbaby.calendar.domain.WorkingDays;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;

class CalculateDeadlineHandlerTest {

    private final CalculateDeadlineHandler handler = new CalculateDeadlineHandler(
            new DeadlinePolicy(new WorkingDays(new PolishHolidays())), Mappers.getMapper(DeadlineDtoMapper.class));

    @Test
    void countsDaysAfterTheEvent() {
        // 21 days after birth on Sat 21 Nov 2026 is Sat 12 Dec -> Mon 14 Dec
        assertThat(handler.handle(new CalculateDeadlineQuery(LocalDate.of(2026, 11, 21), DeadlineType.AFTER, 21, null)))
                .isEqualTo(new DeadlineDto(DeadlineType.AFTER, LocalDate.of(2026, 12, 12), LocalDate.of(2026, 12, 14),
                        true, "sobota", LocalDate.of(2026, 12, 11)));
    }

    @Test
    void countsMonthsAfterTheEvent() {
        DeadlineDto deadline = handler.handle(new CalculateDeadlineQuery(LocalDate.of(2026, 11, 30), DeadlineType.AFTER, null, 3));

        assertThat(deadline.raw()).isEqualTo(LocalDate.of(2027, 2, 28));
        assertThat(deadline.legal()).isEqualTo(LocalDate.of(2027, 3, 1));
    }

    @Test
    void countsDaysBeforeTheEvent() {
        DeadlineDto deadline = handler.handle(new CalculateDeadlineQuery(LocalDate.of(2026, 6, 25), DeadlineType.BEFORE, 21, null));

        assertThat(deadline.type()).isEqualTo(DeadlineType.BEFORE);
        assertThat(deadline.legal()).isEqualTo(LocalDate.of(2026, 6, 4));
        assertThat(deadline.reason()).isEqualTo("Boże Ciało");
    }
}
