package com.hn26.zaradniaki.zusbaby;

import static org.assertj.core.api.Assertions.assertThat;

import com.hn26.zaradniaki.zusbaby.shared.time.DateTimeGenerator;
import java.time.Clock;
import java.time.ZoneId;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.simple.JdbcClient;

@SpringBootTest
@Import(TestcontainersConfiguration.class)
class ContextLoadsIT {

    @Autowired
    private JdbcClient jdbcClient;

    @Autowired
    private Flyway flyway;

    @Autowired
    private Clock clock;

    @Autowired
    private DateTimeGenerator dateTimeGenerator;

    @Test
    void connectsToPostgres() {
        String version = jdbcClient.sql("select version()").query(String.class).single();

        assertThat(version).startsWith("PostgreSQL 17");
    }

    @Test
    void runsFlywayMigrations() {
        assertThat(flyway.info().applied()).isNotEmpty();
    }

    @Test
    void usesPolishLegalTimeZone() {
        assertThat(clock.getZone()).isEqualTo(ZoneId.of("Europe/Warsaw"));
        assertThat(dateTimeGenerator.zone()).isEqualTo(ZoneId.of("Europe/Warsaw"));
    }
}
