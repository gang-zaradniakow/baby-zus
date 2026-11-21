package com.hn26.zaradniaki.zusbaby.shared.domain;

import java.util.Objects;

/**
 * One explained result of a rule, shown to the parent next to a calculation
 * (e.g. "waiting period met", "debt blocks the benefit"). Messages are
 * user-facing and written in Polish.
 */
public record Check(Level level, String message) {

    public enum Level {
        /** Condition met. */
        OK,
        /** Neutral explanation. */
        INFO,
        /** Benefit not granted, blocked or reduced. */
        NO
    }

    public Check {
        Objects.requireNonNull(level, "level");
        if (message == null || message.isBlank()) {
            throw new IllegalArgumentException("Check message must not be blank");
        }
    }

    public static Check ok(String message) {
        return new Check(Level.OK, message);
    }

    public static Check info(String message) {
        return new Check(Level.INFO, message);
    }

    public static Check no(String message) {
        return new Check(Level.NO, message);
    }

    public boolean isNegative() {
        return level == Level.NO;
    }
}
