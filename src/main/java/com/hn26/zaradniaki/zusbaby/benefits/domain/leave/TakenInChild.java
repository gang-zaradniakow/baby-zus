package com.hn26.zaradniaki.zusbaby.benefits.domain.leave;

import java.math.BigDecimal;
import java.util.Objects;

/**
 * Child taken in for adoption or by a foster family.
 * @param type adoption or foster family
 * @param childAge age in years when taken in (e.g. 1.5)
 * @param deferredSchool compulsory schooling deferred (foster family age limit
 *            10 instead of 7)
 */
public record TakenInChild(AdoptionType type, BigDecimal childAge, boolean deferredSchool) {

    public TakenInChild {
        Objects.requireNonNull(type, "type");
        Objects.requireNonNull(childAge, "childAge");
        if (childAge.signum() < 0) {
            throw new IllegalArgumentException("Child age must not be negative, was " + childAge);
        }
    }
}
