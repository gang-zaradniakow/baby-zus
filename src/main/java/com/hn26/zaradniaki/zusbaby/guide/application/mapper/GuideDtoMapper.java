package com.hn26.zaradniaki.zusbaby.guide.application.mapper;

import com.hn26.zaradniaki.zusbaby.calendar.application.dto.DeadlineDto;
import com.hn26.zaradniaki.zusbaby.guide.application.dto.GuestGuideDto;
import com.hn26.zaradniaki.zusbaby.guide.domain.GuidePreview;
import com.hn26.zaradniaki.zusbaby.guide.domain.timeline.TimelineDeadline;
import com.hn26.zaradniaki.zusbaby.shared.mapping.MapStructConfig;
import org.mapstruct.Mapper;

/**
 * Domain results → query results, and the calendar's deadlines → timeline
 * deadlines.
 */
@Mapper(config = MapStructConfig.class)
public interface GuideDtoMapper {

    GuestGuideDto toDto(GuidePreview preview);

    TimelineDeadline toTimelineDeadline(DeadlineDto deadline);
}
