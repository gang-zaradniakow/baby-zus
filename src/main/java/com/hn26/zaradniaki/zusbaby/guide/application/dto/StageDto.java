package com.hn26.zaradniaki.zusbaby.guide.application.dto;

import com.hn26.zaradniaki.zusbaby.guide.domain.survey.CareStage;

public record StageDto(CareStage stage, Integer pregnancyWeek, Integer childAgeMonths, String childAgeLabel) {
}
