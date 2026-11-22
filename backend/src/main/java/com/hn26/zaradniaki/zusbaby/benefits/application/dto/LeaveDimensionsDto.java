package com.hn26.zaradniaki.zusbaby.benefits.application.dto;

import com.hn26.zaradniaki.zusbaby.shared.domain.Weeks;

/**
 * Leave lengths; {@code adoption} and {@code supplementary} are present only
 * for those cases.
 */
public record LeaveDimensionsDto(Weeks maternityWeeks, Weeks parentalWeeks, AdoptionLeaveDto adoption,
        SupplementaryLeaveDto supplementary) {
}
