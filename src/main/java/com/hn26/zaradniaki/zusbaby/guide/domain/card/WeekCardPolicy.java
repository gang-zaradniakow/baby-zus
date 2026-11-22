package com.hn26.zaradniaki.zusbaby.guide.domain.card;

import com.hn26.zaradniaki.zusbaby.guide.domain.stage.StageSummary;
import com.hn26.zaradniaki.zusbaby.guide.domain.survey.CareStage;
import java.util.List;
import java.util.Optional;

/**
 * Card of the week, as the start screen of the frontend prototype picks it: the
 * first card covering the week of pregnancy, otherwise the month of the child's
 * life (also for a child taken in).
 */
public final class WeekCardPolicy {

    public Optional<CardOfTheWeek> card(StageSummary stage, WeekCards cards) {
        boolean pregnancy = stage.stage() == CareStage.PREGNANCY;
        List<WeekCard> list = pregnancy ? cards.pregnancy() : cards.child();
        int value = pregnancy
                ? stage.pregnancyWeek()
                : stage.childAgeMonths() == null ? 0 : stage.childAgeMonths();
        return list.stream().filter(card -> card.covers(value)).findFirst()
                .map(card -> new CardOfTheWeek(pregnancy ? CardPeriod.WEEK : CardPeriod.MONTH, card.articleId(),
                        card.title(), card.text()));
    }
}
