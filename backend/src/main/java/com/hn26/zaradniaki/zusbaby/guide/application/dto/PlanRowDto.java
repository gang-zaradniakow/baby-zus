package com.hn26.zaradniaki.zusbaby.guide.application.dto;

import com.hn26.zaradniaki.zusbaby.guide.domain.plan.PlanItemKind;
import com.hn26.zaradniaki.zusbaby.shared.domain.Weeks;
import java.util.List;

public record PlanRowDto(PlanItemKind kind, String icon, String title, String text, String articleId,
        Weeks totalWeeks, List<PlanLeaveDto> leaves) {
}
