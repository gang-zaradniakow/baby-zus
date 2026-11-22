package com.hn26.zaradniaki.zusbaby.knowledge.application.content;

import java.util.List;

/**
 * Cards of the week.
 * @param pregnancy by week of pregnancy
 * @param child by month of the child's life (0 = first month)
 */
public record WeekCards(List<WeekCard> pregnancy, List<WeekCard> child) {

    public WeekCards {
        pregnancy = List.copyOf(pregnancy);
        child = List.copyOf(child);
    }
}
