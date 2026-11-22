package com.hn26.zaradniaki.zusbaby.benefits.application.query;

import an.awesome.pipelinr.Command;
import com.hn26.zaradniaki.zusbaby.benefits.application.dto.PregnancySicknessDto;
import com.hn26.zaradniaki.zusbaby.benefits.domain.insurance.InsuranceTitles;
import com.hn26.zaradniaki.zusbaby.benefits.domain.sickness.SickLeave;
import jakarta.validation.constraints.NotNull;

/** Pay for a sick leave in pregnancy from the person's insurance titles. */
public record CalculatePregnancySicknessQuery(@NotNull InsuranceTitles titles, @NotNull SickLeave leave)
        implements
            Command<PregnancySicknessDto> {
}
