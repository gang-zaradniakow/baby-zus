package com.hn26.zaradniaki.zusbaby.benefits.infrastructure.config;

import com.hn26.zaradniaki.zusbaby.benefits.domain.base.BenefitBaseCalculator;
import com.hn26.zaradniaki.zusbaby.benefits.domain.insurance.InsuranceTitleResolver;
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
}
