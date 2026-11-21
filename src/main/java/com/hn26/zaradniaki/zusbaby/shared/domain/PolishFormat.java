package com.hn26.zaradniaki.zusbaby.shared.domain;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Polish number formatting for user-facing messages, identical to the frontend
 * prototype ({@code fmtMoney} in {@code js/calc.js}, locale pl-PL): decimal
 * comma, thousands separated by a non-breaking space only from five integer
 * digits ("4147,10 zł", "20 321,30 zł").
 */
public final class PolishFormat {

    private static final char GROUPING_SEPARATOR = ' ';
    private static final int MIN_DIGITS_FOR_GROUPING = 5;

    private PolishFormat() {
    }

    /** Amount with two decimals and the currency: "4147,10 zł". */
    public static String money(Money money) {
        return money(money, 2);
    }

    /**
     * Amount with the given number of decimals (0 or 2) and the currency: "4147
     * zł".
     */
    public static String money(Money money, int decimals) {
        // like the prototype: round to grosze first, then to the requested precision
        BigDecimal value = money.amount().setScale(2, RoundingMode.HALF_UP).setScale(decimals, RoundingMode.HALF_UP);
        return number(value) + " zł";
    }

    /**
     * Rate as a percentage with two decimals, without the sign: 0.1371 → "13,71".
     */
    public static String percent(Rate rate) {
        return rate.percent().setScale(2, RoundingMode.HALF_UP).toPlainString().replace('.', ',');
    }

    private static String number(BigDecimal value) {
        String plain = value.abs().toPlainString();
        int dot = plain.indexOf('.');
        String integer = dot < 0 ? plain : plain.substring(0, dot);
        String fraction = dot < 0 ? "" : "," + plain.substring(dot + 1);
        return (value.signum() < 0 ? "-" : "") + group(integer) + fraction;
    }

    private static String group(String digits) {
        if (digits.length() < MIN_DIGITS_FOR_GROUPING) {
            return digits;
        }
        StringBuilder grouped = new StringBuilder();
        int firstGroup = digits.length() % 3 == 0 ? 3 : digits.length() % 3;
        grouped.append(digits, 0, firstGroup);
        for (int i = firstGroup; i < digits.length(); i += 3) {
            grouped.append(GROUPING_SEPARATOR).append(digits, i, i + 3);
        }
        return grouped.toString();
    }
}
