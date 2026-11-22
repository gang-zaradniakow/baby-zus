package com.hn26.zaradniaki.zusbaby.benefits.application.mapper;

import com.hn26.zaradniaki.zusbaby.benefits.application.dto.AdoptionLeaveDto;
import com.hn26.zaradniaki.zusbaby.benefits.application.dto.BenefitBaseDto;
import com.hn26.zaradniaki.zusbaby.benefits.application.dto.InsuranceResolutionDto;
import com.hn26.zaradniaki.zusbaby.benefits.application.dto.SupplementaryLeaveDto;
import com.hn26.zaradniaki.zusbaby.benefits.domain.base.BenefitBase;
import com.hn26.zaradniaki.zusbaby.benefits.domain.insurance.ResolvedInsurance;
import com.hn26.zaradniaki.zusbaby.benefits.domain.leave.AdoptionLeave;
import com.hn26.zaradniaki.zusbaby.benefits.domain.leave.SupplementaryLeave;
import com.hn26.zaradniaki.zusbaby.shared.mapping.MapStructConfig;
import org.mapstruct.Mapper;

/** Domain results → query results. */
@Mapper(config = MapStructConfig.class)
public interface BenefitsDtoMapper {

    InsuranceResolutionDto toDto(ResolvedInsurance resolution);

    BenefitBaseDto toDto(BenefitBase base);

    AdoptionLeaveDto toDto(AdoptionLeave leave);

    SupplementaryLeaveDto toDto(SupplementaryLeave leave);
}
