package com.hn26.zaradniaki.zusbaby.guide.application.dto;

import com.hn26.zaradniaki.zusbaby.guide.domain.timeline.Institution;
import com.hn26.zaradniaki.zusbaby.guide.domain.timeline.TimelineStatus;
import java.time.LocalDate;

public record TimelineEntryDto(String key, String title, String description, String lateNote,
        Institution institution, LocalDate date, TimelineDeadlineDto deadline, String articleId, String wizardId,
        String calculator, boolean optional, boolean estimate, boolean milestone, LocalDate due, long daysLeft,
        TimelineStatus status) {
}
