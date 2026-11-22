package com.hn26.zaradniaki.zusbaby.guide.application.dto;

import com.hn26.zaradniaki.zusbaby.guide.domain.catalog.Eligibility;
import com.hn26.zaradniaki.zusbaby.guide.domain.timeline.Institution;

public record BenefitEntitlementDto(String key, String title, String summary, Institution institution,
        Eligibility eligibility, String articleId, String wizardId, String calculator) {
}
