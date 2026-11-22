package com.hn26.zaradniaki.zusbaby.calendar.infrastructure.config;

import com.hn26.zaradniaki.zusbaby.calendar.domain.DeadlinePolicy;
import com.hn26.zaradniaki.zusbaby.calendar.domain.PolishHolidays;
import com.hn26.zaradniaki.zusbaby.calendar.domain.WorkingDays;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Registers the plain-Java domain services of the calendar module as Spring
 * beans.
 */
@Configuration(proxyBeanMethods = false)
class CalendarDomainConfiguration {

    @Bean
    PolishHolidays polishHolidays() {
        return new PolishHolidays();
    }

    @Bean
    WorkingDays workingDays(PolishHolidays holidays) {
        return new WorkingDays(holidays);
    }

    @Bean
    DeadlinePolicy deadlinePolicy(WorkingDays workingDays) {
        return new DeadlinePolicy(workingDays);
    }
}
