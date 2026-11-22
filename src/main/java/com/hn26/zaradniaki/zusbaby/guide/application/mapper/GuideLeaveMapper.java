package com.hn26.zaradniaki.zusbaby.guide.application.mapper;

import com.hn26.zaradniaki.zusbaby.benefits.api.model.AdoptionType;
import com.hn26.zaradniaki.zusbaby.benefits.api.model.PretermBirth;
import com.hn26.zaradniaki.zusbaby.benefits.api.model.TakenInChild;
import com.hn26.zaradniaki.zusbaby.benefits.application.dto.LeaveDimensionsDto;
import com.hn26.zaradniaki.zusbaby.benefits.application.query.CalculateLeaveDimensionsQuery;
import com.hn26.zaradniaki.zusbaby.guide.domain.LeaveWeeks;
import com.hn26.zaradniaki.zusbaby.guide.domain.survey.PretermDetails;
import com.hn26.zaradniaki.zusbaby.guide.domain.survey.Survey;
import com.hn26.zaradniaki.zusbaby.shared.domain.Weeks;
import org.springframework.stereotype.Component;

/**
 * Survey → leave dimensions query of the benefits module, and its result → this
 * module's model. As in the prototype's plan, a child taken in is counted as an
 * adoption and a hospital stay as starting on the 5th day after birth.
 */
@Component
public class GuideLeaveMapper {

    private static final int HOSPITAL_START_DAY = 5;

    public CalculateLeaveDimensionsQuery toQuery(Survey survey) {
        return switch (survey.stage()) {
            case PREGNANCY -> new CalculateLeaveDimensionsQuery(survey.children(), false, null, null);
            case CHILD -> new CalculateLeaveDimensionsQuery(survey.children(), survey.zaZyciem(), null,
                    preterm(survey.preterm()));
            case ADOPTION -> new CalculateLeaveDimensionsQuery(survey.children(), survey.zaZyciem(),
                    new TakenInChild(AdoptionType.ADOPTION, survey.childAgeWhenTakenIn(), false), null);
        };
    }

    public LeaveWeeks toLeaveWeeks(LeaveDimensionsDto dimensions) {
        return new LeaveWeeks(dimensions.maternityWeeks(),
                dimensions.supplementary() == null ? Weeks.ZERO : dimensions.supplementary().weeks(),
                dimensions.parentalWeeks());
    }

    private static PretermBirth preterm(PretermDetails details) {
        return details == null
                ? null
                : new PretermBirth(details.gestationWeek(), details.birthWeightGrams(), details.hospitalDays(),
                        HOSPITAL_START_DAY);
    }
}
