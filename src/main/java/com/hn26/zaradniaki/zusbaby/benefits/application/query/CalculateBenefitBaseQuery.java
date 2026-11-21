package com.hn26.zaradniaki.zusbaby.benefits.application.query;

import an.awesome.pipelinr.Command;
import com.hn26.zaradniaki.zusbaby.benefits.application.dto.BenefitBaseDto;
import com.hn26.zaradniaki.zusbaby.benefits.domain.base.MonthlyPay;
import com.hn26.zaradniaki.zusbaby.benefits.domain.insurance.InsuranceTitle;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

/**
 * Benefit base from up to 12 months of pay on the payer's certificate (Z-3 /
 * Z-3a).
 */
public record CalculateBenefitBaseQuery(@NotEmpty @Size(max = 12) List<@NotNull MonthlyPay> months,
        @NotNull InsuranceTitle title, boolean fullTime) implements Command<BenefitBaseDto> {
}
