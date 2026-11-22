package com.hn26.zaradniaki.zusbaby.knowledge.infrastructure.web;

import com.hn26.zaradniaki.zusbaby.api.model.ContentWeekCardsDto;
import com.hn26.zaradniaki.zusbaby.api.model.FormEntryDto;
import com.hn26.zaradniaki.zusbaby.knowledge.application.dto.FormDto;
import com.hn26.zaradniaki.zusbaby.knowledge.application.dto.WeekCardsDto;
import com.hn26.zaradniaki.zusbaby.shared.mapping.MapStructConfig;
import java.util.List;
import org.mapstruct.Mapper;

/**
 * Query results → generated REST DTOs. Generated support contacts share the
 * simple name with the application DTO, hence the fully qualified name.
 */
@Mapper(config = MapStructConfig.class)
interface ContentWebMapper {

    List<FormEntryDto> toForms(List<FormDto> forms);

    com.hn26.zaradniaki.zusbaby.api.model.SupportContactsDto toResponse(
            com.hn26.zaradniaki.zusbaby.knowledge.application.dto.SupportContactsDto contacts);

    ContentWeekCardsDto toResponse(WeekCardsDto cards);
}
