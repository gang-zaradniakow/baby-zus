package com.hn26.zaradniaki.zusbaby;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;

import com.tngtech.archunit.core.domain.JavaClass;
import com.tngtech.archunit.lang.ArchCondition;
import com.tngtech.archunit.lang.ArchRule;
import com.tngtech.archunit.lang.ConditionEvents;
import com.tngtech.archunit.lang.SimpleConditionEvent;
import org.springframework.web.bind.annotation.RestController;

/**
 * API-first conventions (plan, section 2.9). Shared by {@link ArchitectureTest}
 * and {@code ApiFirstRulesTest}.
 */
public final class ApiFirstRules {

    /**
     * Every controller implements an interface generated from openapi.yaml
     * ({@code ..api.*Api}).
     */
    public static final ArchRule controllersImplementGeneratedApi = classes().that()
            .areAnnotatedWith(RestController.class).should(implementGeneratedApi())
            .because("endpoints are defined in openapi.yaml first (plan, section 2.9)").allowEmptyShould(true);

    private ApiFirstRules() {
    }

    private static ArchCondition<JavaClass> implementGeneratedApi() {
        return new ArchCondition<>("implement a generated *Api interface") {
            @Override
            public void check(JavaClass javaClass, ConditionEvents events) {
                boolean ok = javaClass.getAllRawInterfaces().stream()
                        .anyMatch(api -> api.getPackageName().endsWith(".api") && api.getSimpleName().endsWith("Api"));
                events.add(new SimpleConditionEvent(javaClass, ok,
                        javaClass.getName() + (ok ? " implements" : " does not implement") + " a generated *Api"));
            }
        };
    }
}
