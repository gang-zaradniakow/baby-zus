package com.hn26.zaradniaki.zusbaby.guide.infrastructure.config;

import com.hn26.zaradniaki.zusbaby.guide.domain.GuidePreviewer;
import com.hn26.zaradniaki.zusbaby.guide.domain.alert.AlertPolicy;
import com.hn26.zaradniaki.zusbaby.guide.domain.card.WeekCardPolicy;
import com.hn26.zaradniaki.zusbaby.guide.domain.catalog.BenefitCatalogPolicy;
import com.hn26.zaradniaki.zusbaby.guide.domain.plan.BenefitPlanPolicy;
import com.hn26.zaradniaki.zusbaby.guide.domain.stage.StagePolicy;
import com.hn26.zaradniaki.zusbaby.guide.domain.timeline.TimelinePolicy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Framework-free domain services of the guide as beans. */
@Configuration
class GuideDomainConfiguration {

    @Bean
    GuidePreviewer guidePreviewer() {
        return new GuidePreviewer(new StagePolicy(), new AlertPolicy(), new TimelinePolicy(), new BenefitPlanPolicy(),
                new BenefitCatalogPolicy(), new WeekCardPolicy());
    }
}
