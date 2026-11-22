package com.hn26.zaradniaki.zusbaby.calendar.application.handler;

import an.awesome.pipelinr.Command;
import com.hn26.zaradniaki.zusbaby.calendar.application.dto.DeadlineDto;
import com.hn26.zaradniaki.zusbaby.calendar.application.mapper.DeadlineDtoMapper;
import com.hn26.zaradniaki.zusbaby.calendar.application.query.CalculateDeadlineQuery;
import com.hn26.zaradniaki.zusbaby.calendar.domain.Deadline;
import com.hn26.zaradniaki.zusbaby.calendar.domain.DeadlinePolicy;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
class CalculateDeadlineHandler implements Command.Handler<CalculateDeadlineQuery, DeadlineDto> {

    private final DeadlinePolicy policy;
    private final DeadlineDtoMapper mapper;

    @Override
    @Transactional(readOnly = true)
    public DeadlineDto handle(CalculateDeadlineQuery query) {
        Deadline deadline = switch (query.type()) {
            case BEFORE -> policy.daysBefore(query.event(), query.days());
            case AFTER -> query.months() != null
                    ? policy.monthsAfter(query.event(), query.months())
                    : policy.daysAfter(query.event(), query.days());
        };
        return mapper.toDto(deadline);
    }
}
