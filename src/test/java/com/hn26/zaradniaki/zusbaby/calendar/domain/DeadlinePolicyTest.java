package com.hn26.zaradniaki.zusbaby.calendar.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatIllegalArgumentException;

import com.hn26.zaradniaki.zusbaby.calendar.api.model.DeadlineType;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

/**
 * Expected values were computed by the frontend prototype ({@code deadline()}
 * and {@code deadlineMonths()} in {@code js/calc.js}), so the backend gives the
 * same answers as the mockup.
 */
class DeadlinePolicyTest {

    enum Kind {
        DAYS_AFTER,
        DAYS_BEFORE,
        MONTHS_AFTER
    }

    private final DeadlinePolicy policy = new DeadlinePolicy(new WorkingDays(new PolishHolidays()));

    @ParameterizedTest(name = "{0} {2} from {1} -> legal {4}, safe {7}")
    @CsvSource(emptyValue = "", value = {
            "DAYS_AFTER, 2026-11-21, 21, 2026-12-12, 2026-12-14, true, sobota, 2026-12-11",
            "DAYS_AFTER, 2026-12-03, 21, 2026-12-24, 2026-12-28, true, Wigilia (od 2025 r.), 2026-12-23",
            "DAYS_AFTER, 2026-11-02, 21, 2026-11-23, 2026-11-23, false, , 2026-11-20",
            "DAYS_AFTER, 2026-03-16, 21, 2026-04-06, 2026-04-07, true, Poniedziałek Wielkanocny, 2026-04-03",
            "DAYS_AFTER, 2025-12-03, 21, 2025-12-24, 2025-12-29, true, Wigilia (od 2025 r.), 2025-12-23",
            "DAYS_AFTER, 2024-12-03, 21, 2024-12-24, 2024-12-24, false, , 2024-12-23",
            "DAYS_AFTER, 2026-05-12, 21, 2026-06-02, 2026-06-02, false, , 2026-06-01",
            "DAYS_AFTER, 2026-04-20, 7, 2026-04-27, 2026-04-27, false, , 2026-04-24",
            "DAYS_BEFORE, 2026-06-25, 21, 2026-06-04, 2026-06-04, false, Boże Ciało, 2026-06-03",
            "DAYS_BEFORE, 2026-03-29, 21, 2026-03-08, 2026-03-08, false, niedziela, 2026-03-06",
            "DAYS_BEFORE, 2026-11-23, 7, 2026-11-16, 2026-11-16, false, , 2026-11-16",
            "DAYS_BEFORE, 2027-01-20, 14, 2027-01-06, 2027-01-06, false, Trzech Króli, 2027-01-05",
            "MONTHS_AFTER, 2026-11-30, 3, 2027-02-28, 2027-03-01, true, niedziela, 2027-02-26",
            "MONTHS_AFTER, 2026-10-31, 6, 2027-04-30, 2027-04-30, false, , 2027-04-29",
            "MONTHS_AFTER, 2026-01-31, 1, 2026-02-28, 2026-03-02, true, sobota, 2026-02-27",
            "MONTHS_AFTER, 2026-08-15, 12, 2027-08-15, 2027-08-16, true, Wniebowzięcie NMP, 2027-08-13"})
    void countsDeadlinesLikeTheMockup(Kind kind, LocalDate event, int amount, LocalDate raw, LocalDate legal,
            boolean shifted, String reason, LocalDate safe) {
        Deadline deadline = switch (kind) {
            case DAYS_AFTER -> policy.daysAfter(event, amount);
            case DAYS_BEFORE -> policy.daysBefore(event, amount);
            case MONTHS_AFTER -> policy.monthsAfter(event, amount);
        };

        DeadlineType type = kind == Kind.DAYS_BEFORE ? DeadlineType.BEFORE : DeadlineType.AFTER;
        assertThat(deadline).isEqualTo(
                new Deadline(type, raw, legal, shifted, reason == null || reason.isEmpty() ? null : reason, safe));
    }

    @Test
    void beforeDeadlineIsNeverMovedForward() {
        // 21 days before 25 June 2026 is Corpus Christi; moving it to Friday would make
        // the application late
        Deadline deadline = policy.daysBefore(LocalDate.of(2026, 6, 25), 21);

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
