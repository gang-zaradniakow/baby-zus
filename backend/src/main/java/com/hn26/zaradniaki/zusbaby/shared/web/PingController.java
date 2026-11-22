package com.hn26.zaradniaki.zusbaby.shared.web;

import com.hn26.zaradniaki.zusbaby.api.SystemApi;
import com.hn26.zaradniaki.zusbaby.api.model.PingResponseDto;
import com.hn26.zaradniaki.zusbaby.shared.time.DateTimeGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

/**
 * Technical endpoint proving the API-first setup: implements the interface
 * generated from openapi.yaml.
 */
@RestController
@RequiredArgsConstructor
class PingController implements SystemApi {

    private final DateTimeGenerator dateTimeGenerator;

    @Override
    public ResponseEntity<PingResponseDto> ping() {
        var time = dateTimeGenerator.now().atZone(dateTimeGenerator.zone()).toOffsetDateTime();
        return ResponseEntity.ok(new PingResponseDto(PingResponseDto.StatusEnum.UP, time));
    }
}
