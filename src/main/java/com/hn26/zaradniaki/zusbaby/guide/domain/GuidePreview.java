package com.hn26.zaradniaki.zusbaby.guide.domain;

import com.hn26.zaradniaki.zusbaby.guide.domain.alert.Alert;
import com.hn26.zaradniaki.zusbaby.guide.domain.stage.StageSummary;
import com.hn26.zaradniaki.zusbaby.guide.domain.timeline.TimelineItem;
import java.util.List;

/**
 * What a guest sees after the survey.
 * @param stage week of pregnancy or age of the child
 * @param alerts warnings, in the order of the prototype
 * @param timeline deadlines and milestones by date
 */
public record GuidePreview(StageSummary stage, List<Alert> alerts, List<TimelineItem> timeline) {

    public GuidePreview {
        alerts = List.copyOf(alerts);
        timeline = List.copyOf(timeline);
    }
}
