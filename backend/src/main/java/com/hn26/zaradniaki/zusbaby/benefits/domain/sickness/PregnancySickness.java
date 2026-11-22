package com.hn26.zaradniaki.zusbaby.benefits.domain.sickness;

import com.hn26.zaradniaki.zusbaby.shared.domain.Check;
import com.hn26.zaradniaki.zusbaby.shared.domain.Money;
import java.util.List;

/**
 * Pay for a sick leave in pregnancy from all insurance titles.
 * @param checks explanation (insurance titles, waiting period)
 * @param parts paid periods per title
 * @param total gross total
 * @param netTotal total after the income tax advance
 */
public record PregnancySickness(List<Check> checks, List<SicknessPayPart> parts, Money total, Money netTotal) {

    public PregnancySickness {
        checks = List.copyOf(checks);
        parts = List.copyOf(parts);
    }
}
