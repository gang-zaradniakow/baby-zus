package com.hn26.zaradniaki.zusbaby.guide.application.mapper;

import com.hn26.zaradniaki.zusbaby.calendar.application.dto.DeadlineDto;
import com.hn26.zaradniaki.zusbaby.guide.application.dto.BenefitEntitlementDto;
import com.hn26.zaradniaki.zusbaby.guide.application.dto.GuestGuideDto;
import com.hn26.zaradniaki.zusbaby.guide.domain.GuidePreview;
import com.hn26.zaradniaki.zusbaby.guide.domain.card.WeekCards;
import com.hn26.zaradniaki.zusbaby.guide.domain.catalog.CatalogBenefit;
import com.hn26.zaradniaki.zusbaby.guide.domain.catalog.EntitledBenefit;
import com.hn26.zaradniaki.zusbaby.guide.domain.timeline.TimelineDeadline;
import com.hn26.zaradniaki.zusbaby.knowledge.application.dto.WeekCardsDto;
import com.hn26.zaradniaki.zusbaby.shared.mapping.MapStructConfig;
import org.mapstruct.Mapper;

/**
 * Domain results → query results, and results of other modules' queries → this
 * module's model.
 */
@Mapper(config = MapStructConfig.class)
public interface GuideDtoMapper {

    GuestGuideDto toDto(GuidePreview preview);

    default BenefitEntitlementDto toDto(EntitledBenefit entitled) {
        CatalogBenefit benefit = entitled.benefit();
        return new BenefitEntitlementDto(benefit.key(), benefit.title(), benefit.summary(), benefit.institution(),
                entitled.eligibility(), benefit.articleId(), benefit.wizardId(), benefit.calculator());
    }

    TimelineDeadline toTimelineDeadline(DeadlineDto deadline);

    WeekCards toWeekCards(WeekCardsDto cards);
}
