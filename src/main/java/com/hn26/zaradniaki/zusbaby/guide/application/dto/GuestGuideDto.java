package com.hn26.zaradniaki.zusbaby.guide.application.dto;

import java.util.List;

public record GuestGuideDto(StageDto stage, List<AlertDto> alerts, List<TimelineEntryDto> timeline,
        List<PlanRowDto> plan, List<BenefitEntitlementDto> benefits, GuideCardDto weekCard) {
}
