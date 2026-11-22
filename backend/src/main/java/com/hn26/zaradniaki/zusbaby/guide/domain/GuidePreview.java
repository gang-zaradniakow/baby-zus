package com.hn26.zaradniaki.zusbaby.guide.domain;

import com.hn26.zaradniaki.zusbaby.guide.domain.alert.Alert;
import com.hn26.zaradniaki.zusbaby.guide.domain.card.CardOfTheWeek;
import com.hn26.zaradniaki.zusbaby.guide.domain.catalog.EntitledBenefit;
import com.hn26.zaradniaki.zusbaby.guide.domain.plan.PlanItem;
import com.hn26.zaradniaki.zusbaby.guide.domain.stage.StageSummary;
import com.hn26.zaradniaki.zusbaby.guide.domain.timeline.TimelineItem;
import java.util.List;

/**
 * What a guest sees after the survey.
 * @param stage week of pregnancy or age of the child
 * @param alerts warnings, in the order of the prototype
 * @param timeline deadlines and milestones by date
 * @param plan benefit plan "Co Ci przysługuje"
 * @param benefits benefits of the catalog the family can (or may) get
 * @param weekCard card of this week or month, may be {@code null}
 */
public record GuidePreview(StageSummary stage, List<Alert> alerts, List<TimelineItem> timeline, List<PlanItem> plan,
        List<EntitledBenefit> benefits, CardOfTheWeek weekCard) {

    public GuidePreview {
        alerts = List.copyOf(alerts);
        timeline = List.copyOf(timeline);
        plan = List.copyOf(plan);
        benefits = List.copyOf(benefits);
    }
}
