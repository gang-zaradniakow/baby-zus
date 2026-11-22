package com.hn26.zaradniaki.zusbaby.guide.application.dto;

import com.hn26.zaradniaki.zusbaby.guide.domain.alert.AlertLevel;

public record AlertDto(AlertLevel level, String icon, String title, String text, String href) {
}
