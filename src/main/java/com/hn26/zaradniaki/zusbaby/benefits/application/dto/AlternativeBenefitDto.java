package com.hn26.zaradniaki.zusbaby.benefits.application.dto;

import com.hn26.zaradniaki.zusbaby.benefits.domain.maternity.AlternativeBenefitKind;
import com.hn26.zaradniaki.zusbaby.shared.domain.Money;
import com.hn26.zaradniaki.zusbaby.shared.domain.Weeks;

public record AlternativeBenefitDto(AlternativeBenefitKind kind, String title, String payer, Money monthly,
        Weeks weeks) {
}
