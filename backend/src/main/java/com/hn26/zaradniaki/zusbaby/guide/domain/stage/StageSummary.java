package com.hn26.zaradniaki.zusbaby.guide.domain.stage;

import com.hn26.zaradniaki.zusbaby.guide.domain.survey.CareStage;

/**
 * Where the family is today.
 * @param stage pregnancy, born child or a child taken in
 * @param pregnancyWeek week of pregnancy (1–42), only during pregnancy
 * @param childAgeMonths full months of the child's life, when it is born
 * @param childAgeLabel Polish age, e.g. {@code 2 tyg. 3 dni}, {@code 10 mies.},
 *            {@code 2 lata}
 */
public record StageSummary(CareStage stage, Integer pregnancyWeek, Integer childAgeMonths, String childAgeLabel) {
}
