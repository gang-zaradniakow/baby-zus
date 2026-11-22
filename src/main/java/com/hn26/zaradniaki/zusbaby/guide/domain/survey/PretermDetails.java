package com.hn26.zaradniaki.zusbaby.guide.domain.survey;

/**
 * Premature baby or a baby in hospital.
 * @param gestationWeek week of pregnancy at birth
 * @param birthWeightGrams birth weight
 * @param hospitalDays days in hospital
 */
public record PretermDetails(int gestationWeek, int birthWeightGrams, int hospitalDays) {
}
