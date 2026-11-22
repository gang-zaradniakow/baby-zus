package com.hn26.zaradniaki.zusbaby.legalrules.infrastructure.web;

import com.hn26.zaradniaki.zusbaby.api.model.LegalParametersResponseDto;
import com.hn26.zaradniaki.zusbaby.legalrules.application.dto.LegalParametersDto;
import com.hn26.zaradniaki.zusbaby.shared.mapping.MapStructConfig;
import org.mapstruct.Mapper;

/** Query result → generated REST DTO (field names match, enums map by name). */
@Mapper(config = MapStructConfig.class)
interface LegalParametersWebMapper {

    LegalParametersResponseDto toResponse(LegalParametersDto parameters);
}
