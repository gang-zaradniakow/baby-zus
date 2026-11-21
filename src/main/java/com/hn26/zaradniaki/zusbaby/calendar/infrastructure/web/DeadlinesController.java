package com.hn26.zaradniaki.zusbaby.calendar.infrastructure.web;

import an.awesome.pipelinr.Pipeline;
import com.hn26.zaradniaki.zusbaby.api.DeadlinesApi;
import com.hn26.zaradniaki.zusbaby.api.model.DeadlineDto;
import com.hn26.zaradniaki.zusbaby.api.model.DeadlineTypeDto;
import java.time.LocalDate;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
class DeadlinesController implements DeadlinesApi {

    private final Pipeline pipeline;
    private final DeadlinesWebMapper mapper;

    @Override
    public ResponseEntity<DeadlineDto> calculateDeadline(LocalDate event, DeadlineTypeDto type, Integer days,
            Integer months) {
        return ResponseEntity.ok(mapper.toResponse(pipeline.send(mapper.toQuery(event, type, days, months))));
    }
}
