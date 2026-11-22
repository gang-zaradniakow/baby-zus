package com.hn26.zaradniaki.zusbaby.guide.domain;

import static org.assertj.core.api.Assertions.assertThat;

import com.hn26.zaradniaki.zusbaby.calendar.domain.Deadline;
import com.hn26.zaradniaki.zusbaby.calendar.domain.DeadlinePolicy;
import com.hn26.zaradniaki.zusbaby.calendar.domain.PolishHolidays;
import com.hn26.zaradniaki.zusbaby.calendar.domain.WorkingDays;
import com.hn26.zaradniaki.zusbaby.golden.GoldenCase;
import com.hn26.zaradniaki.zusbaby.golden.GoldenCases;
import com.hn26.zaradniaki.zusbaby.guide.domain.alert.Alert;
import com.hn26.zaradniaki.zusbaby.guide.domain.alert.AlertLevel;
import com.hn26.zaradniaki.zusbaby.guide.domain.alert.AlertPolicy;
import com.hn26.zaradniaki.zusbaby.guide.domain.stage.StagePolicy;
import com.hn26.zaradniaki.zusbaby.guide.domain.survey.CareStage;
import com.hn26.zaradniaki.zusbaby.guide.domain.survey.ParentRole;
import com.hn26.zaradniaki.zusbaby.guide.domain.survey.PartnerTracking;
import com.hn26.zaradniaki.zusbaby.guide.domain.survey.PretermDetails;
import com.hn26.zaradniaki.zusbaby.guide.domain.survey.Survey;
import com.hn26.zaradniaki.zusbaby.guide.domain.survey.WorkForm;
import com.hn26.zaradniaki.zusbaby.guide.domain.timeline.DeadlineCalendar;
import com.hn26.zaradniaki.zusbaby.guide.domain.timeline.Institution;
import com.hn26.zaradniaki.zusbaby.guide.domain.timeline.TimelineDeadline;
import com.hn26.zaradniaki.zusbaby.guide.domain.timeline.TimelineItem;
import com.hn26.zaradniaki.zusbaby.guide.domain.timeline.TimelinePolicy;
import com.hn26.zaradniaki.zusbaby.guide.domain.timeline.TimelineStatus;
import com.hn26.zaradniaki.zusbaby.shared.domain.Weeks;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.stream.Stream;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;

class GuidePreviewerTest {

    /** "Today" of the golden file (GUIDE_TODAY in tools/golden/generate.mjs). */
    private static final LocalDate TODAY = LocalDate.of(2026, 11, 22);

    record Input(ParentRole role, CareStage stage, LocalDate date, LocalDate childBirthDate, int children,
            PretermDetails preterm, Set<WorkForm> work, PartnerTracking partner) {

        Survey toSurvey() {
            return new Survey(role, stage, date, childBirthDate, children, preterm, work, partner);
        }
    }

    record ExpectedStage(Integer pregnancyWeek, Integer childAgeMonths, String childAgeLabel) {
    }

    record ExpectedItem(String key, String title, String description, String lateNote, Institution institution,
            LocalDate date, TimelineDeadline deadline, String articleId, String wizardId, String calculator,
            boolean optional, boolean estimate, boolean milestone, LocalDate due, long daysLeft,
            TimelineStatus status) {

        TimelineItem toItem() {
            return new TimelineItem(key, title, description, lateNote, institution, date, deadline, articleId,
                    wizardId, calculator, optional, estimate, milestone, due, daysLeft, status);
        }
    }

    record ExpectedAlert(AlertLevel level, String icon, String title, String text, String href) {
    }

    record Expected(ExpectedStage stage, List<ExpectedAlert> alerts, List<ExpectedItem> timeline) {
    }

    /** Deadlines counted by the calendar module's own rules. */
    private static final DeadlineCalendar CALENDAR = new DeadlineCalendar() {
        private final DeadlinePolicy policy = new DeadlinePolicy(new WorkingDays(new PolishHolidays()));

        @Override
        public TimelineDeadline daysAfter(LocalDate event, int days) {
            return toTimeline(policy.daysAfter(event, days));
        }

        @Override
        public TimelineDeadline daysBefore(LocalDate event, int days) {
            return toTimeline(policy.daysBefore(event, days));
        }

        private TimelineDeadline toTimeline(Deadline deadline) {
            return new TimelineDeadline(deadline.type(), deadline.raw(),
                    deadline.legal(), deadline.shifted(), deadline.reason(), deadline.safe());
        }
    };

    private static final GuideParameters PARAMETERS = new GuideParameters(
            Stream.of(20, 31, 33, 35, 37).map(Weeks::of).toList());

    private final GuidePreviewer previewer = new GuidePreviewer(new StagePolicy(), new AlertPolicy(),
            new TimelinePolicy());

    /**
     * Timeline, alerts and stage of {@code buildTimeline()}, {@code alerts()} and
     * {@code ctx()} in the prototype, for its personas and other answers
     * (golden/guestGuide.json).
     */
    static Stream<GoldenCase<Input, Expected>> mockupCases() {
        return GoldenCases.load("guestGuide", Input.class, Expected.class);
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("mockupCases")
    void guidesLikeTheMockup(GoldenCase<Input, Expected> golden) {
        Survey survey = golden.input().toSurvey();

        GuidePreview preview = previewer.preview(survey, PARAMETERS, CALENDAR, TODAY);

        Expected expected = golden.expected();
        assertThat(preview.stage().stage()).isEqualTo(survey.stage());
        assertThat(preview.stage().pregnancyWeek()).isEqualTo(expected.stage().pregnancyWeek());
        assertThat(preview.stage().childAgeMonths()).isEqualTo(expected.stage().childAgeMonths());
        assertThat(preview.stage().childAgeLabel()).isEqualTo(expected.stage().childAgeLabel());
        assertThat(preview.alerts()).isEqualTo(expected.alerts().stream()
                .map(alert -> new Alert(alert.level(), alert.icon(), alert.title(), alert.text(), alert.href()))
                .toList());
        assertThat(preview.timeline()).isEqualTo(expected.timeline().stream().map(ExpectedItem::toItem).toList());
    }
}
