package com.hn26.zaradniaki.zusbaby.guide.application.handler;

import static org.assertj.core.api.Assertions.assertThat;

import an.awesome.pipelinr.Command;
import an.awesome.pipelinr.Notification;
import an.awesome.pipelinr.Pipeline;
import com.hn26.zaradniaki.zusbaby.benefits.application.dto.LeaveDimensionsDto;
import com.hn26.zaradniaki.zusbaby.benefits.application.query.CalculateLeaveDimensionsQuery;
import com.hn26.zaradniaki.zusbaby.calendar.application.dto.DeadlineDto;
import com.hn26.zaradniaki.zusbaby.calendar.application.query.CalculateDeadlineQuery;
import com.hn26.zaradniaki.zusbaby.calendar.domain.Deadline;
import com.hn26.zaradniaki.zusbaby.calendar.domain.DeadlinePolicy;
import com.hn26.zaradniaki.zusbaby.calendar.domain.PolishHolidays;
import com.hn26.zaradniaki.zusbaby.calendar.domain.WorkingDays;
import com.hn26.zaradniaki.zusbaby.guide.application.dto.TimelineEntryDto;
import com.hn26.zaradniaki.zusbaby.guide.application.mapper.GuideDtoMapper;
import com.hn26.zaradniaki.zusbaby.guide.application.mapper.GuideLeaveMapper;
import com.hn26.zaradniaki.zusbaby.guide.application.mapper.GuideParametersMapper;
import com.hn26.zaradniaki.zusbaby.guide.application.query.PreviewGuideQuery;
import com.hn26.zaradniaki.zusbaby.guide.domain.GuidePreviewer;
import com.hn26.zaradniaki.zusbaby.guide.domain.alert.AlertPolicy;
import com.hn26.zaradniaki.zusbaby.guide.domain.card.WeekCardPolicy;
import com.hn26.zaradniaki.zusbaby.guide.domain.catalog.BenefitCatalogPolicy;
import com.hn26.zaradniaki.zusbaby.guide.domain.plan.BenefitPlanPolicy;
import com.hn26.zaradniaki.zusbaby.guide.domain.plan.PlanItemKind;
import com.hn26.zaradniaki.zusbaby.guide.domain.stage.StagePolicy;
import com.hn26.zaradniaki.zusbaby.guide.domain.survey.CareStage;
import com.hn26.zaradniaki.zusbaby.guide.domain.survey.ParentRole;
import com.hn26.zaradniaki.zusbaby.guide.domain.survey.PartnerTracking;
import com.hn26.zaradniaki.zusbaby.guide.domain.survey.WorkForm;
import com.hn26.zaradniaki.zusbaby.guide.domain.timeline.TimelinePolicy;
import com.hn26.zaradniaki.zusbaby.knowledge.application.dto.WeekCardDto;
import com.hn26.zaradniaki.zusbaby.knowledge.application.dto.WeekCardsDto;
import com.hn26.zaradniaki.zusbaby.knowledge.application.query.GetWeekCardsQuery;
import com.hn26.zaradniaki.zusbaby.legalrules.api.model.ParameterKey;
import com.hn26.zaradniaki.zusbaby.legalrules.application.dto.LegalParametersDto;
import com.hn26.zaradniaki.zusbaby.legalrules.application.dto.ParameterDto;
import com.hn26.zaradniaki.zusbaby.legalrules.application.query.GetCurrentLegalParametersQuery;
import com.hn26.zaradniaki.zusbaby.shared.domain.Rate;
import com.hn26.zaradniaki.zusbaby.shared.domain.Weeks;
import com.hn26.zaradniaki.zusbaby.shared.time.FixedDateTimeGenerator;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;

/**
 * The handler takes the maternity leave and rates from the legalrules query
 * (here a changed 2027 legal state), the deadlines from the calendar query, the
 * leave lengths from the benefits query and the cards from the knowledge query.
 */
class PreviewGuideHandlerTest {

    private static final LocalDate BIRTH = LocalDate.of(2027, 3, 1);

    private final DeadlinePolicy deadlines = new DeadlinePolicy(new WorkingDays(new PolishHolidays()));

    private final Pipeline pipeline = new Pipeline() {
        @Override
        @SuppressWarnings("unchecked")
        public <R, C extends Command<R>> R send(C command) {
            return (R) switch (command) {
                case GetCurrentLegalParametersQuery _ -> new LegalParametersDto(2, LocalDate.of(2027, 1, 1),
                        "Stan prawny 2027",
                        List.of(new ParameterDto(ParameterKey.MATERNITY_LEAVE_WEEKS,
                                ParameterKey.MATERNITY_LEAVE_WEEKS.kind(), ParameterKey.MATERNITY_LEAVE_WEEKS.label(),
                                null, Stream.of(22, 33, 35, 37, 39).map(BigDecimal::valueOf).toList()),
                                rate(ParameterKey.MATERNITY_LEAVE_RATE, "1"),
                                rate(ParameterKey.SUPPLEMENTARY_LEAVE_RATE, "1"),
                                rate(ParameterKey.PARENTAL_LEAVE_RATE, "0.75")));
                case CalculateLeaveDimensionsQuery _ -> new LeaveDimensionsDto(Weeks.of(22), Weeks.of(41), null, null);
                case GetWeekCardsQuery _ -> new WeekCardsDto(List.of(),
                        List.of(new WeekCardDto(0, 0, "wysokosc-mac", "Pierwsze 21 dni", "Wniosek o 81,5%.")));
                case CalculateDeadlineQuery query -> toDto(switch (query.type()) {
                    case AFTER -> deadlines.daysAfter(query.event(), query.days());
                    case BEFORE -> deadlines.daysBefore(query.event(), query.days());
                });
                default -> throw new IllegalArgumentException("Unexpected " + command);
            };
        }

        @Override
        public <N extends Notification> void send(N notification) {
            throw new UnsupportedOperationException();
        }
    };

    private final PreviewGuideHandler handler = new PreviewGuideHandler(pipeline,
            new GuidePreviewer(new StagePolicy(), new AlertPolicy(), new TimelinePolicy(), new BenefitPlanPolicy(),
                    new BenefitCatalogPolicy(), new WeekCardPolicy()),
            new GuideParametersMapper(), new GuideLeaveMapper(), Mappers.getMapper(GuideDtoMapper.class),
            FixedDateTimeGenerator.onDay(BIRTH.plusDays(10)));

    @Test
    void countsTheTimelineWithTheCurrentMaternityLeaveAndTheCalendarsDeadlines() {
        var guide = handler.handle(new PreviewGuideQuery(ParentRole.MOTHER, CareStage.CHILD, BIRTH, null, 1, null,
                false, Set.of(WorkForm.EMPLOYMENT), PartnerTracking.ONLY_ME));

        // 22 weeks of maternity leave in the changed legal state
        assertThat(entry(guide.timeline(), "mac-end").date()).isEqualTo(BIRTH.plusWeeks(22));
        // 21 days after 1 March 2027 is Monday 22 March, a working day
        TimelineEntryDto application = entry(guide.timeline(), "w81");
        assertThat(application.deadline().legal()).isEqualTo(LocalDate.of(2027, 3, 22));
        assertThat(application.daysLeft()).isEqualTo(11);
        assertThat(guide.stage().childAgeLabel()).isEqualTo("1 tyg. 3 dni");
        // leave lengths from the benefits query, parental rate of the changed legal
        // state
        var leaves = guide.plan().stream().filter(row -> row.kind() == PlanItemKind.LEAVES).findFirst().orElseThrow();
        assertThat(leaves.totalWeeks()).isEqualTo(Weeks.of(63));
        assertThat(leaves.leaves().getLast().rate()).isEqualTo(Rate.of("0.75"));
        // card of the week from the knowledge query
        assertThat(guide.weekCard().title()).isEqualTo("Pierwsze 21 dni");
    }

    private static ParameterDto rate(ParameterKey key, String value) {
        return new ParameterDto(key, key.kind(), key.label(), new BigDecimal(value), null);
    }

    private static TimelineEntryDto entry(List<TimelineEntryDto> timeline, String key) {
        return timeline.stream().filter(entry -> entry.key().equals(key)).findFirst().orElseThrow();
    }

    private static DeadlineDto toDto(Deadline deadline) {
        return new DeadlineDto(deadline.type(), deadline.raw(), deadline.legal(), deadline.shifted(),
                deadline.reason(), deadline.safe());
    }
}
