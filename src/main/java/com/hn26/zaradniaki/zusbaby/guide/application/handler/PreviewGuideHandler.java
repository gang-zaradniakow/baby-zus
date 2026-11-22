package com.hn26.zaradniaki.zusbaby.guide.application.handler;

import an.awesome.pipelinr.Command;
import an.awesome.pipelinr.Pipeline;
import com.hn26.zaradniaki.zusbaby.calendar.api.model.DeadlineType;
import com.hn26.zaradniaki.zusbaby.calendar.application.query.CalculateDeadlineQuery;
import com.hn26.zaradniaki.zusbaby.guide.application.dto.GuestGuideDto;
import com.hn26.zaradniaki.zusbaby.guide.application.mapper.GuideDtoMapper;
import com.hn26.zaradniaki.zusbaby.guide.application.mapper.GuideParametersMapper;
import com.hn26.zaradniaki.zusbaby.guide.application.query.PreviewGuideQuery;
import com.hn26.zaradniaki.zusbaby.guide.domain.GuidePreviewer;
import com.hn26.zaradniaki.zusbaby.guide.domain.survey.Survey;
import com.hn26.zaradniaki.zusbaby.guide.domain.timeline.DeadlineCalendar;
import com.hn26.zaradniaki.zusbaby.guide.domain.timeline.TimelineDeadline;
import com.hn26.zaradniaki.zusbaby.legalrules.application.query.GetCurrentLegalParametersQuery;
import com.hn26.zaradniaki.zusbaby.shared.time.DateTimeGenerator;
import java.time.LocalDate;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Legal parameters come from the legalrules query, deadlines from the calendar
 * query.
 */
@Component
@RequiredArgsConstructor
class PreviewGuideHandler implements Command.Handler<PreviewGuideQuery, GuestGuideDto> {

    private final Pipeline pipeline;
    private final GuidePreviewer previewer;
    private final GuideParametersMapper parametersMapper;
    private final GuideDtoMapper mapper;
    private final DateTimeGenerator dateTimeGenerator;

    @Override
    @Transactional(readOnly = true)
    public GuestGuideDto handle(PreviewGuideQuery query) {
        Survey survey = new Survey(query.role(), query.stage(), query.date(), query.childBirthDate(),
                query.children(), query.preterm(), query.work(), query.partner());
        return mapper.toDto(previewer.preview(survey,
                parametersMapper.toGuideParameters(pipeline.send(new GetCurrentLegalParametersQuery())),
                new CalendarDeadlines(), dateTimeGenerator.today()));
    }

    /** Deadlines counted by the calendar module. */
    private final class CalendarDeadlines implements DeadlineCalendar {

        @Override
        public TimelineDeadline daysAfter(LocalDate event, int days) {
            return deadline(event, DeadlineType.AFTER, days);
        }

        @Override
        public TimelineDeadline daysBefore(LocalDate event, int days) {
            return deadline(event, DeadlineType.BEFORE, days);
        }

        private TimelineDeadline deadline(LocalDate event, DeadlineType type, int days) {
            return mapper.toTimelineDeadline(pipeline.send(new CalculateDeadlineQuery(event, type, days, null)));
        }
    }
}
