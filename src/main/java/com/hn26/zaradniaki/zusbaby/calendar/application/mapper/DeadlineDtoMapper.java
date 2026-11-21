package com.hn26.zaradniaki.zusbaby.calendar.application.mapper;

import com.hn26.zaradniaki.zusbaby.calendar.application.dto.DeadlineDto;
import com.hn26.zaradniaki.zusbaby.calendar.domain.Deadline;
import com.hn26.zaradniaki.zusbaby.shared.mapping.MapStructConfig;
import org.mapstruct.Mapper;

@Mapper(config = MapStructConfig.class)
public interface DeadlineDtoMapper {

    DeadlineDto toDto(Deadline deadline);
}
