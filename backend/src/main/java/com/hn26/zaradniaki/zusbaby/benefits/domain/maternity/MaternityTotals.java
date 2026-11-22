package com.hn26.zaradniaki.zusbaby.benefits.domain.maternity;

import com.hn26.zaradniaki.zusbaby.shared.domain.Money;

/** Benefits for the whole leave, after the income tax advance. */
public record MaternityTotals(Money mother, Money father, Money family) {
}
