package com.hn26.zaradniaki.zusbaby.guide.infrastructure.web;

import com.hn26.zaradniaki.zusbaby.api.model.EntitledBenefitDto;
import com.hn26.zaradniaki.zusbaby.api.model.GuidePreviewDto;
import com.hn26.zaradniaki.zusbaby.api.model.GuideSurveyDto;
import com.hn26.zaradniaki.zusbaby.guide.application.dto.GuestGuideDto;
import com.hn26.zaradniaki.zusbaby.guide.application.query.PreviewGuideQuery;
import com.hn26.zaradniaki.zusbaby.guide.domain.catalog.Eligibility;
import com.hn26.zaradniaki.zusbaby.shared.mapping.MapStructConfig;
import org.mapstruct.Mapper;
import org.mapstruct.MappingConstants;
import org.mapstruct.ValueMapping;

/** Generated REST DTOs ↔ queries and their results. */
@Mapper(config = MapStructConfig.class)
interface GuideWebMapper {

    PreviewGuideQuery toQuery(GuideSurveyDto survey);

    GuidePreviewDto toResponse(GuestGuideDto guide);

    /** Benefits the family cannot get are never in the guide. */
    @ValueMapping(source = "NO", target = MappingConstants.THROW_EXCEPTION)
    EntitledBenefitDto.EligibilityEnum toEligibility(Eligibility eligibility);
}
