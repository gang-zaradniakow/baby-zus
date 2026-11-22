package com.hn26.zaradniaki.zusbaby.benefits.infrastructure.web;

import com.hn26.zaradniaki.zusbaby.api.model.BenefitBaseRequestDto;
import com.hn26.zaradniaki.zusbaby.api.model.InsuranceTitlesRequestDto;
import com.hn26.zaradniaki.zusbaby.api.model.LeaveDimensionsRequestDto;
import com.hn26.zaradniaki.zusbaby.benefits.application.dto.BenefitBaseDto;
import com.hn26.zaradniaki.zusbaby.benefits.application.dto.InsuranceResolutionDto;
import com.hn26.zaradniaki.zusbaby.benefits.application.dto.LeaveDimensionsDto;
import com.hn26.zaradniaki.zusbaby.benefits.application.query.CalculateBenefitBaseQuery;
import com.hn26.zaradniaki.zusbaby.benefits.application.query.CalculateLeaveDimensionsQuery;
import com.hn26.zaradniaki.zusbaby.benefits.domain.insurance.InsuranceTitles;
import com.hn26.zaradniaki.zusbaby.shared.mapping.MapStructConfig;
import org.mapstruct.Mapper;

/**
 * Generated REST DTOs ↔ queries and their results. Generated response classes
 * share simple names with the application DTOs, hence the fully qualified
 * names.
 */
@Mapper(config = MapStructConfig.class)
interface CalculationsWebMapper {

    InsuranceTitles toTitles(InsuranceTitlesRequestDto request);

    CalculateBenefitBaseQuery toQuery(BenefitBaseRequestDto request);

    com.hn26.zaradniaki.zusbaby.api.model.InsuranceResolutionDto toResponse(InsuranceResolutionDto resolution);

    com.hn26.zaradniaki.zusbaby.api.model.BenefitBaseDto toResponse(BenefitBaseDto base);

    CalculateLeaveDimensionsQuery toQuery(LeaveDimensionsRequestDto request);

    com.hn26.zaradniaki.zusbaby.api.model.LeaveDimensionsDto toResponse(LeaveDimensionsDto dimensions);
}
