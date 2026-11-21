package com.hn26.zaradniaki.zusbaby;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noMethods;

import com.tngtech.archunit.base.DescribedPredicate;
import com.tngtech.archunit.core.domain.JavaCall;
import com.tngtech.archunit.core.domain.JavaModifier;
import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;

/**
 * Architecture rules from docs/backend-plan.md (sections 2.1, 2.6 and 2.10).
 */
@AnalyzeClasses(packagesOf = ZusBabyApplication.class, importOptions = ImportOption.DoNotIncludeTests.class)
class ArchitectureTest {

    /**
     * Domain model is plain Java: no framework, no persistence, no outer layers.
     */
    @ArchTest
    static final ArchRule domainIsFrameworkFree = noClasses().that().resideInAPackage("..domain..").should()
            .dependOnClassesThat().resideInAnyPackage("org.springframework..", "jakarta.persistence..",
                    "org.hibernate..", "..application..", "..infrastructure..")
            .because("the domain layer must stay plain Java (plan, section 2.6)");

    /** Application layer does not reach into adapters. */
    @ArchTest
    static final ArchRule applicationDoesNotUseInfrastructure = noClasses().that().resideInAPackage("..application..")
            .should().dependOnClassesThat().resideInAPackage("..infrastructure..").allowEmptyShould(true);

    /** Current time only through DateTimeGenerator, so tests can freeze it. */
    @ArchTest
    static final ArchRule noDirectNowCalls = noClasses().that().resideOutsideOfPackage("..shared.time..").should()
            .callMethodWhere(javaTimeNow())
            .because("the current time must come from DateTimeGenerator (shared.time)");

    /** Aggregates change state only through behaviour methods, never setters. */
    @ArchTest
    static final ArchRule noPublicSettersInDomain = noMethods().that().areDeclaredInClassesThat()
            .resideInAPackage("..domain..").and().haveNameStartingWith("set").should()
            .haveModifier(JavaModifier.PUBLIC).because("aggregates must not expose setters (plan, section 2.10)")
            .allowEmptyShould(true);

    private static DescribedPredicate<JavaCall<?>> javaTimeNow() {
        return DescribedPredicate.describe("java.time *.now()",
                call -> call.getTargetOwner().getPackageName().equals("java.time")
                        && call.getName().equals("now"));
    }
}
