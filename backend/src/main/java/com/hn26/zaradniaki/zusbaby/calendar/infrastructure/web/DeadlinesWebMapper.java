package com.hn26.zaradniaki.zusbaby.calendar.infrastructure.web;

import com.hn26.zaradniaki.zusbaby.api.model.DeadlineTypeDto;
import com.hn26.zaradniaki.zusbaby.calendar.application.dto.DeadlineDto;
import com.hn26.zaradniaki.zusbaby.calendar.application.query.CalculateDeadlineQuery;
import com.hn26.zaradniaki.zusbaby.shared.mapping.MapStructConfig;
import java.time.LocalDate;
import org.mapstruct.Mapper;

/**
 * Request parameters → query, query result → generated REST DTO. The generated
 * class has the same simple name as the application DTO, hence the fully
 * qualified name.
 */
@Mapper(config = MapStructConfig.class)
interface DeadlinesWebMapper {

    CalculateDeadlineQuery toQuery(LocalDate event, DeadlineTypeDto type, Integer days, Integer months);

    com.hn26.zaradniaki.zusbaby.api.model.DeadlineDto toResponse(DeadlineDto deadline);
}
