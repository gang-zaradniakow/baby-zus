package com.hn26.zaradniaki.zusbaby.benefits.application.dto;

import com.hn26.zaradniaki.zusbaby.benefits.domain.insurance.InsuranceTitle;
import com.hn26.zaradniaki.zusbaby.shared.domain.Check;
import com.hn26.zaradniaki.zusbaby.shared.domain.Money;
import java.util.List;

/**
 * Titles that give a benefit; {@code mainTitle} is {@code null} when none does.
 */
public record InsuranceResolutionDto(InsuranceTitle mainTitle, Money base, List<TitleBaseDto> parts,
        List<Check> checks, boolean agriculturalInsurance, Money blockingDebt) {
}
