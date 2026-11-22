package com.hn26.zaradniaki.zusbaby.guide.domain;

import com.hn26.zaradniaki.zusbaby.guide.domain.alert.AlertPolicy;
import com.hn26.zaradniaki.zusbaby.guide.domain.stage.StagePolicy;
import com.hn26.zaradniaki.zusbaby.guide.domain.survey.Survey;
import com.hn26.zaradniaki.zusbaby.guide.domain.timeline.DeadlineCalendar;
import com.hn26.zaradniaki.zusbaby.guide.domain.timeline.TimelinePolicy;
import java.time.LocalDate;
import java.util.Objects;

/** Guide of a guest, from the survey answers alone. */
public final class GuidePreviewer {

    private final StagePolicy stagePolicy;
    private final AlertPolicy alertPolicy;
    private final TimelinePolicy timelinePolicy;

    public GuidePreviewer(StagePolicy stagePolicy, AlertPolicy alertPolicy, TimelinePolicy timelinePolicy) {
        this.stagePolicy = Objects.requireNonNull(stagePolicy, "stagePolicy");
        this.alertPolicy = Objects.requireNonNull(alertPolicy, "alertPolicy");
        this.timelinePolicy = Objects.requireNonNull(timelinePolicy, "timelinePolicy");
    }

    public GuidePreview preview(Survey survey, GuideParameters parameters, DeadlineCalendar calendar,
            LocalDate today) {
        return new GuidePreview(stagePolicy.summary(survey, today), alertPolicy.alerts(survey),
                timelinePolicy.timeline(survey, parameters, calendar, today));
    }
}
