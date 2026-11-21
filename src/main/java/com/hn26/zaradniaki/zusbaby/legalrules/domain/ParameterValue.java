package com.hn26.zaradniaki.zusbaby.legalrules.domain;

import com.hn26.zaradniaki.zusbaby.legalrules.api.model.ParameterKey;
import com.hn26.zaradniaki.zusbaby.legalrules.api.model.ParameterKind;
import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * Value of one legal parameter: a single number, or five numbers indexed by the
 * number of children (1, 2, 3, 4, 5+). Stored and exchanged as text:
 * {@code "4806"}, {@code "0.815"}, {@code "20,31,33,35,37"}.
 */
public sealed interface ParameterValue permits ParameterValue.Single, ParameterValue.ByChildren {

    int CHILD_COUNT_VARIANTS = 5;

    /** Text form used in storage. */
    String asText();

    /**
     * Fails with a gentle message when the value does not fit the parameter's kind.
     */
    void validateFor(ParameterKey key);

    static Single of(BigDecimal value) {
        return new Single(value);
    }

    static Single of(String value) {
        return new Single(new BigDecimal(value));
    }

    static ByChildren ofChildren(long... weeks) {
        return new ByChildren(Arrays.stream(weeks).mapToObj(BigDecimal::valueOf).toList());
    }

    /**
     * Parses the text form according to the kind of {@code key}, then validates it.
     */
    static ParameterValue parse(ParameterKey key, String text) {
        Objects.requireNonNull(text, "text");
        ParameterValue value;
        try {
            value = key.kind() == ParameterKind.WEEKS_BY_CHILDREN
                    ? new ByChildren(Arrays.stream(text.split(",")).map(String::trim).map(BigDecimal::new).toList())
                    : new Single(new BigDecimal(text.trim()));
        } catch (NumberFormatException ex) {
            throw new InvalidLegalParametersException(
                    "Wartość „%s” parametru „%s” nie jest liczbą.".formatted(text, key.label()));
        }
        value.validateFor(key);
        return value;
    }

    record Single(BigDecimal value) implements ParameterValue {

        public Single {
            value = normalized(Objects.requireNonNull(value, "value"));
        }

        @Override
        public String asText() {
            return value.stripTrailingZeros().toPlainString();
        }

        @Override
        public void validateFor(ParameterKey key) {
            ParameterKind kind = key.kind();
            if (kind == ParameterKind.WEEKS_BY_CHILDREN) {
                throw new InvalidLegalParametersException(
                        "Parametr „%s” wymaga %d wartości (dla 1–5+ dzieci).".formatted(key.label(),
                                CHILD_COUNT_VARIANTS));
            }
            if (value.signum() < 0) {
                throw new InvalidLegalParametersException(
                        "Parametr „%s” nie może być ujemny.".formatted(key.label()));
            }
            if (kind == ParameterKind.RATE && value.compareTo(BigDecimal.ONE) > 0) {
                throw new InvalidLegalParametersException(
                        "Parametr „%s” to ułamek od 0 do 1 (np. 0,815 dla 81,5%%).".formatted(key.label()));
            }
            if (kind.isWholeNumber() && !isWhole(value)) {
                throw new InvalidLegalParametersException(
                        "Parametr „%s” musi być liczbą całkowitą.".formatted(key.label()));
            }
        }
    }

    record ByChildren(List<BigDecimal> values) implements ParameterValue {

        public ByChildren {
            values = values.stream().map(ParameterValue::normalized).toList();
        }

        /** Value for the given number of children; 5 and more share the last value. */
        public BigDecimal forChildren(int children) {
            if (children < 1) {
                throw new IllegalArgumentException("Number of children must be at least 1, was " + children);
            }
            return values.get(Math.min(children, CHILD_COUNT_VARIANTS) - 1);
        }

        @Override
        public String asText() {
            return values.stream().map(v -> v.stripTrailingZeros().toPlainString()).collect(Collectors.joining(","));
        }

        @Override
        public void validateFor(ParameterKey key) {
            if (key.kind() != ParameterKind.WEEKS_BY_CHILDREN) {
                throw new InvalidLegalParametersException(
                        "Parametr „%s” przyjmuje jedną wartość.".formatted(key.label()));
            }
            if (values.size() != CHILD_COUNT_VARIANTS) {
                throw new InvalidLegalParametersException(
                        "Parametr „%s” wymaga %d wartości (dla 1–5+ dzieci), podano %d.".formatted(key.label(),
                                CHILD_COUNT_VARIANTS, values.size()));
            }
            if (values.stream().anyMatch(v -> v.signum() < 0 || !isWhole(v))) {
                throw new InvalidLegalParametersException(
                        "Wartości parametru „%s” muszą być nieujemnymi liczbami całkowitymi.".formatted(key.label()));
            }
        }
    }

    /**
     * Same number, same representation: equality must not depend on scale
     * ("4147.10" equals "4147.1").
     */
    private static BigDecimal normalized(BigDecimal value) {
        BigDecimal stripped = value.stripTrailingZeros();
        return stripped.scale() < 0 ? stripped.setScale(0) : stripped;
    }

    private static boolean isWhole(BigDecimal value) {
        return value.stripTrailingZeros().scale() <= 0;
    }
}
