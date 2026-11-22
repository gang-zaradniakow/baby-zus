package com.hn26.zaradniaki.zusbaby.benefits.infrastructure.web;

import com.hn26.zaradniaki.zusbaby.api.model.BenefitBaseRequestDto;
import com.hn26.zaradniaki.zusbaby.api.model.FatherLeaveRequestDto;
import com.hn26.zaradniaki.zusbaby.api.model.InsuranceTitlesRequestDto;
import com.hn26.zaradniaki.zusbaby.api.model.LeaveDimensionsRequestDto;
import com.hn26.zaradniaki.zusbaby.api.model.MaternitySimulationRequestDto;
import com.hn26.zaradniaki.zusbaby.api.model.PregnancySicknessRequestDto;
import com.hn26.zaradniaki.zusbaby.benefits.application.dto.BenefitBaseDto;
import com.hn26.zaradniaki.zusbaby.benefits.application.dto.InsuranceResolutionDto;
import com.hn26.zaradniaki.zusbaby.benefits.application.dto.LeaveDimensionsDto;
import com.hn26.zaradniaki.zusbaby.benefits.application.dto.MaternitySimulationDto;
import com.hn26.zaradniaki.zusbaby.benefits.application.dto.PregnancySicknessDto;
import com.hn26.zaradniaki.zusbaby.benefits.application.query.CalculateBenefitBaseQuery;
import com.hn26.zaradniaki.zusbaby.benefits.application.query.CalculateLeaveDimensionsQuery;
import com.hn26.zaradniaki.zusbaby.benefits.application.query.CalculatePregnancySicknessQuery;
import com.hn26.zaradniaki.zusbaby.benefits.application.query.SimulateMaternityBenefitQuery;
import com.hn26.zaradniaki.zusbaby.benefits.domain.insurance.InsuranceTitles;
import com.hn26.zaradniaki.zusbaby.benefits.domain.maternity.FatherLeaveChoices;
import com.hn26.zaradniaki.zusbaby.benefits.domain.sickness.SickLeave;
import com.hn26.zaradniaki.zusbaby.shared.mapping.MapStructConfig;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

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

    SickLeave toLeave(PregnancySicknessRequestDto request);

    default CalculatePregnancySicknessQuery toQuery(PregnancySicknessRequestDto request) {
        return new CalculatePregnancySicknessQuery(toTitles(request.getTitles()), toLeave(request));
    }

    com.hn26.zaradniaki.zusbaby.api.model.PregnancySicknessDto toResponse(PregnancySicknessDto sickness);

    FatherLeaveChoices toChoices(FatherLeaveRequestDto father);

    @Mapping(target = "father", source = "father.titles")
    @Mapping(target = "fatherChoices", source = "father")
    SimulateMaternityBenefitQuery toQuery(MaternitySimulationRequestDto request);

    com.hn26.zaradniaki.zusbaby.api.model.MaternitySimulationDto toResponse(MaternitySimulationDto simulation);
}
