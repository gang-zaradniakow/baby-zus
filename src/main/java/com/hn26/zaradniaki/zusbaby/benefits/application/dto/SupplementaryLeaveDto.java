package com.hn26.zaradniaki.zusbaby.benefits.application.dto;

import com.hn26.zaradniaki.zusbaby.shared.domain.Weeks;

public record SupplementaryLeaveDto(Weeks weeks, Weeks limit, String rule) {
}
