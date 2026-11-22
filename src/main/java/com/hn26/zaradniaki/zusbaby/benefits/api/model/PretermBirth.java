package com.hn26.zaradniaki.zusbaby.benefits.api.model;

/**
 * Premature birth or hospital stay of a newborn.
 * @param gestationWeek week of pregnancy at birth
 * @param birthWeightGrams birth weight
 * @param hospitalDays days in hospital (until the 8th / 15th week after birth)
 * @param hospitalStartDay day after birth the stay started (matters after the
 *            37th week)
 */
public record PretermBirth(int gestationWeek, int birthWeightGrams, int hospitalDays, int hospitalStartDay) {
}
