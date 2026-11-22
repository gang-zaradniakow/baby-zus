package com.hn26.zaradniaki.zusbaby.calendar.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatIllegalArgumentException;

import com.hn26.zaradniaki.zusbaby.calendar.api.model.DeadlineType;
import com.hn26.zaradniaki.zusbaby.golden.GoldenCase;
import com.hn26.zaradniaki.zusbaby.golden.GoldenCases;
import java.time.LocalDate;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;

class DeadlinePolicyTest {

    enum Kind {
        DAYS_AFTER,
        DAYS_BEFORE,
        MONTHS_AFTER
    }

    record Input(Kind kind, LocalDate event, int amount) {
    }

    private final DeadlinePolicy policy = new DeadlinePolicy(new WorkingDays(new PolishHolidays()));

    /**
     * Expected values computed by the frontend prototype (golden/deadlines.json).
     */
    static Stream<GoldenCase<Input, Deadline>> mockupCases() {
        return GoldenCases.load("deadlines", Input.class, Deadline.class);
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("mockupCases")
    void countsDeadlinesLikeTheMockup(GoldenCase<Input, Deadline> golden) {
        Input input = golden.input();

        Deadline deadline = switch (input.kind()) {
            case DAYS_AFTER -> policy.daysAfter(input.event(), input.amount());
            case DAYS_BEFORE -> policy.daysBefore(input.event(), input.amount());
            case MONTHS_AFTER -> policy.monthsAfter(input.event(), input.amount());
        };

        assertThat(deadline).isEqualTo(golden.expected());
    }

    @Test
    void beforeDeadlineIsNeverMovedForward() {
        // 21 days before 25 June 2026 is Corpus Christi; moving it to Friday would make
        // the application late
        Deadline deadline = policy.daysBefore(LocalDate.of(2026, 6, 25), 21);

        assertThat(deadline.type()).isEqualTo(DeadlineType.BEFORE);
        assertThat(deadline.legal()).isEqualTo(LocalDate.of(2026, 6, 4));
        assertThat(deadline.safe()).isBefore(deadline.legal());
        assertThat(deadline.shifted()).isFalse();
    }

    @Test
    void rejectsNonPositivePeriod() {
        LocalDate event = LocalDate.of(2026, 11, 21);

        assertThatIllegalArgumentException().isThrownBy(() -> policy.daysAfter(event, 0));
        assertThatIllegalArgumentException().isThrownBy(() -> policy.daysBefore(event, -1));
        assertThatIllegalArgumentException().isThrownBy(() -> policy.monthsAfter(event, 0));
    }
}
