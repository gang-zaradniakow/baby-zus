package com.hn26.zaradniaki.zusbaby.guide.application.dto;

import com.hn26.zaradniaki.zusbaby.guide.domain.plan.LeaveKind;
import com.hn26.zaradniaki.zusbaby.shared.domain.Rate;
import com.hn26.zaradniaki.zusbaby.shared.domain.Weeks;

public record PlanLeaveDto(LeaveKind kind, String label, Weeks weeks, Rate rate) {
}
