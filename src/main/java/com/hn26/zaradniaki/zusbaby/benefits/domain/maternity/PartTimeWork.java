package com.hn26.zaradniaki.zusbaby.benefits.domain.maternity;

import com.hn26.zaradniaki.zusbaby.shared.domain.Rate;
import java.math.BigDecimal;
import java.util.Objects;

/**
 * Parental leave combined with part-time work (art. 182¹e KP): the benefit
 * drops by the part worked and the leave is extended accordingly.
 * @param parent who works
 * @param share part of full time worked, more than 0 and at most a half
 * @param weeks weeks of parental leave combined with work
 */
public record PartTimeWork(Parent parent, Rate share, int weeks) {

    private static final BigDecimal MAX_SHARE = new BigDecimal("0.5");

    public PartTimeWork {
        Objects.requireNonNull(parent, "parent");
        Objects.requireNonNull(share, "share");
        if (share.value().signum() <= 0 || share.value().compareTo(MAX_SHARE) > 0) {
            throw new IllegalArgumentException("Part-time work share must be in (0, 0.5], was " + share);
        }
        if (weeks < 0) {
            throw new IllegalArgumentException("Weeks of work must not be negative, was " + weeks);
        }
    }
}
