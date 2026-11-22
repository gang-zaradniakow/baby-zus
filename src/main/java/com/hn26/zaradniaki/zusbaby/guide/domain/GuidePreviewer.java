package com.hn26.zaradniaki.zusbaby.guide.domain;

import com.hn26.zaradniaki.zusbaby.guide.domain.alert.AlertPolicy;
import com.hn26.zaradniaki.zusbaby.guide.domain.card.WeekCardPolicy;
import com.hn26.zaradniaki.zusbaby.guide.domain.card.WeekCards;
import com.hn26.zaradniaki.zusbaby.guide.domain.catalog.BenefitCatalogPolicy;
import com.hn26.zaradniaki.zusbaby.guide.domain.plan.BenefitPlanPolicy;
import com.hn26.zaradniaki.zusbaby.guide.domain.stage.StagePolicy;
import com.hn26.zaradniaki.zusbaby.guide.domain.stage.StageSummary;
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
    private final BenefitPlanPolicy planPolicy;
    private final BenefitCatalogPolicy catalogPolicy;
    private final WeekCardPolicy weekCardPolicy;

    public GuidePreviewer(StagePolicy stagePolicy, AlertPolicy alertPolicy, TimelinePolicy timelinePolicy,
            BenefitPlanPolicy planPolicy, BenefitCatalogPolicy catalogPolicy, WeekCardPolicy weekCardPolicy) {
        this.stagePolicy = Objects.requireNonNull(stagePolicy, "stagePolicy");
        this.alertPolicy = Objects.requireNonNull(alertPolicy, "alertPolicy");
        this.timelinePolicy = Objects.requireNonNull(timelinePolicy, "timelinePolicy");
        this.planPolicy = Objects.requireNonNull(planPolicy, "planPolicy");
        this.catalogPolicy = Objects.requireNonNull(catalogPolicy, "catalogPolicy");
        this.weekCardPolicy = Objects.requireNonNull(weekCardPolicy, "weekCardPolicy");
    }

    /**
     * @param leaveWeeks leave lengths of the family (benefits module)
     * @param cards cards of the week (knowledge module)
     */
    public GuidePreview preview(Survey survey, GuideParameters parameters, DeadlineCalendar calendar,
            LeaveWeeks leaveWeeks, WeekCards cards, LocalDate today) {
        StageSummary stage = stagePolicy.summary(survey, today);
        return new GuidePreview(stage, alertPolicy.alerts(survey),
                timelinePolicy.timeline(survey, parameters, calendar, today),
                planPolicy.plan(survey, leaveWeeks, parameters),
                catalogPolicy.benefits(survey, stage.childAgeMonths(), today),
                weekCardPolicy.card(stage, cards).orElse(null));
    }
}
