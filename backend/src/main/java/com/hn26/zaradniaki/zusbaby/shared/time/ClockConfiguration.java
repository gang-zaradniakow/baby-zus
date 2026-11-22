package com.hn26.zaradniaki.zusbaby.shared.time;

import java.time.Clock;
import java.time.ZoneId;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Single source of the current time. Legal deadlines are counted in Polish
 * calendar days, so the clock always uses the Europe/Warsaw zone regardless of
 * the server settings.
 */
@Configuration(proxyBeanMethods = false)
public class ClockConfiguration {

    public static final ZoneId LEGAL_ZONE = ZoneId.of("Europe/Warsaw");

    @Bean
    Clock clock() {
        return Clock.system(LEGAL_ZONE);
    }

    @Bean
    DateTimeGenerator dateTimeGenerator(Clock clock) {
        return new ClockDateTimeGenerator(clock);
    }
}
