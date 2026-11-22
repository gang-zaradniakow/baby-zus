package com.hn26.zaradniaki.zusbaby.benefits.domain.sickness;

/**
 * Sick leave in pregnancy (e-ZLA with code B).
 * @param days days of sick leave
 * @param usedSickPayDays sick-pay days from the employer already used this
 *            calendar year
 * @param aged50OrMore aged 50 or more: 14 days of sick pay instead of 33
 * @param insuredDays days of uninterrupted sickness insurance before the leave
 *            (waiting period)
 */
public record SickLeave(int days, int usedSickPayDays, boolean aged50OrMore, int insuredDays) {

    public SickLeave {
        if (days < 0 || usedSickPayDays < 0 || insuredDays < 0) {
            throw new IllegalArgumentException("Sick leave days must not be negative");
        }
    }
}
