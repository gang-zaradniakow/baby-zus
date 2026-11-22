package com.hn26.zaradniaki.zusbaby.guide.domain.catalog;

/**
 * Benefit of the catalog the family can (or may) get.
 * @param benefit the benefit
 * @param eligibility {@link Eligibility#YES} or {@link Eligibility#MAYBE}
 */
public record EntitledBenefit(CatalogBenefit benefit, Eligibility eligibility) {
}
