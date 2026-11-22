package com.hn26.zaradniaki.zusbaby.benefits.infrastructure.config;

import com.hn26.zaradniaki.zusbaby.benefits.domain.base.BenefitBaseCalculator;
import com.hn26.zaradniaki.zusbaby.benefits.domain.insurance.InsuranceTitleResolver;
import com.hn26.zaradniaki.zusbaby.benefits.domain.leave.AdoptionLeavePolicy;
import com.hn26.zaradniaki.zusbaby.benefits.domain.leave.LeaveDimensionsPolicy;
import com.hn26.zaradniaki.zusbaby.benefits.domain.leave.SupplementaryLeavePolicy;
import com.hn26.zaradniaki.zusbaby.benefits.domain.sickness.PregnancySicknessCalculator;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Registers the plain-Java domain services of the benefits module as Spring
 * beans.
 */
@Configuration(proxyBeanMethods = false)
class BenefitsDomainConfiguration {

    @Bean
    InsuranceTitleResolver insuranceTitleResolver() {
        return new InsuranceTitleResolver();
    }

    @Bean
    BenefitBaseCalculator benefitBaseCalculator() {
        return new BenefitBaseCalculator();
    }

    @Bean
    LeaveDimensionsPolicy leaveDimensionsPolicy() {
        return new LeaveDimensionsPolicy();
    }

    @Bean
    AdoptionLeavePolicy adoptionLeavePolicy(LeaveDimensionsPolicy dimensions) {
        return new AdoptionLeavePolicy(dimensions);
    }

    @Bean
    SupplementaryLeavePolicy supplementaryLeavePolicy() {
        return new SupplementaryLeavePolicy();
    }

    @Bean
    PregnancySicknessCalculator pregnancySicknessCalculator() {
        return new PregnancySicknessCalculator();
    }
}
