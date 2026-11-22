package com.hn26.zaradniaki.zusbaby.benefits.application.dto;

import com.hn26.zaradniaki.zusbaby.benefits.domain.maternity.Parent;
import com.hn26.zaradniaki.zusbaby.shared.domain.Money;
import com.hn26.zaradniaki.zusbaby.shared.domain.Rate;
import com.hn26.zaradniaki.zusbaby.shared.domain.Weeks;
import java.time.LocalDate;

public record LeaveSegmentDto(Parent parent, String label, Weeks weeks, Rate rate, Rate workFactor, LocalDate from,
        LocalDate to, Money monthlyGross, Money monthlyNet, Money total) {
}
