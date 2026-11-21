package com.hn26.zaradniaki.zusbaby.calendar.application.query;

import static org.assertj.core.api.Assertions.assertThat;

import com.hn26.zaradniaki.zusbaby.calendar.api.model.DeadlineType;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import java.time.LocalDate;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

class CalculateDeadlineQueryTest {

    private static final LocalDate EVENT = LocalDate.of(2026, 11, 21);

    private static ValidatorFactory factory;
    private static Validator validator;

    @BeforeAll
    static void createValidator() {
        factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @AfterAll
    static void closeValidator() {
        factory.close();
    }

    @Test
    void acceptsTheThreeSupportedForms() {
        assertThat(validator.validate(new CalculateDeadlineQuery(EVENT, DeadlineType.AFTER, 21, null))).isEmpty();
        assertThat(validator.validate(new CalculateDeadlineQuery(EVENT, DeadlineType.AFTER, null, 3))).isEmpty();
        assertThat(validator.validate(new CalculateDeadlineQuery(EVENT, DeadlineType.BEFORE, 21, null))).isEmpty();
    }

    @Test
    void requiresExactlyOnePeriod() {
        assertThat(violatedProperties(new CalculateDeadlineQuery(EVENT, DeadlineType.AFTER, null, null)))
                .containsExactly("exactlyOnePeriod");
        assertThat(violatedProperties(new CalculateDeadlineQuery(EVENT, DeadlineType.AFTER, 21, 3)))
                .containsExactly("exactlyOnePeriod");
    }

    @Test
    void countsBeforeDeadlinesOnlyInDays() {
        assertThat(violatedProperties(new CalculateDeadlineQuery(EVENT, DeadlineType.BEFORE, null, 1)))
                .containsExactly("beforeCountedInDays");
    }

    @Test
    void requiresEventTypeAndPositivePeriod() {
        assertThat(violatedProperties(new CalculateDeadlineQuery(null, null, 0, null))).containsExactlyInAnyOrder(
                "event", "type", "days");
    }

    private static java.util.List<String> violatedProperties(CalculateDeadlineQuery query) {
        return validator.validate(query).stream().map(ConstraintViolation::getPropertyPath).map(Object::toString)
                .toList();
    }
}
