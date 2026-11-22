package com.hn26.zaradniaki.zusbaby.guide.domain.card;

import java.util.List;

/**
 * Cards of the week.
 * @param pregnancy by week of pregnancy
 * @param child by month of the child's life
 */
public record WeekCards(List<WeekCard> pregnancy, List<WeekCard> child) {

    public WeekCards {
        pregnancy = List.copyOf(pregnancy);
        child = List.copyOf(child);
    }
}
