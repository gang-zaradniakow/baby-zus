package com.hn26.zaradniaki.zusbaby.benefits.application.dto;

import com.hn26.zaradniaki.zusbaby.shared.domain.Money;

public record BenefitBaseDto(Money base, Money average, int monthsCounted, String note) {
}
