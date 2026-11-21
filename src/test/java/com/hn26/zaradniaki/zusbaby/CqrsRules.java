package com.hn26.zaradniaki.zusbaby;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.methods;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

import an.awesome.pipelinr.Command;
import com.tngtech.archunit.base.DescribedPredicate;
import com.tngtech.archunit.core.domain.JavaClass;
import com.tngtech.archunit.core.domain.JavaMethod;
import com.tngtech.archunit.core.domain.JavaModifier;
import com.tngtech.archunit.lang.ArchCondition;
import com.tngtech.archunit.lang.ArchRule;
import com.tngtech.archunit.lang.ConditionEvents;
import com.tngtech.archunit.lang.SimpleConditionEvent;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.RestController;

/**
 * CQRS conventions (plan, section 2.4). Rules are shared by
 * {@link ArchitectureTest} (production code) and {@code CqrsRulesTest}
 * (fixtures proving that each rule catches violations).
 */
public final class CqrsRules {

    private static final String COMMANDS = "..application.command..";
    private static final String QUERIES = "..application.query..";

    /** Handlers live next to their commands or queries. */
    public static final ArchRule handlersLiveInCommandOrQueryPackage = classes().that()
            .implement(Command.Handler.class).should().resideInAnyPackage(COMMANDS, QUERIES)
            .because("handlers belong to application.command or application.query").allowEmptyShould(true);

    /** Commands and queries are immutable records. */
    public static final ArchRule commandsAndQueriesAreRecords = classes().that().implement(Command.class).and()
            .resideInAnyPackage(COMMANDS, QUERIES).should(beRecords()).allowEmptyShould(true);

    /** Command handlers write in a read-write transaction. */
    public static final ArchRule commandHandlersAreTransactional = methods().that(areHandleMethods()).and()
            .areDeclaredInClassesThat().resideInAPackage(COMMANDS).should(beTransactional(false))
            .allowEmptyShould(true);

    /** Query handlers only read, in a read-only transaction. */
    public static final ArchRule queryHandlersAreReadOnly = methods().that(areHandleMethods()).and()
            .areDeclaredInClassesThat().resideInAPackage(QUERIES).should(beTransactional(true))
            .allowEmptyShould(true);

    /** Controllers talk to the application only through the Pipeline. */
    public static final ArchRule controllersUseOnlyPipeline = noClasses().that()
            .areAnnotatedWith(RestController.class).should().dependOnClassesThat(implementHandler()).orShould()
            .dependOnClassesThat().resideInAnyPackage("..persistence..", "..domain..")
            .because("controllers send commands and queries through Pipeline (plan, section 2.4)")
            .allowEmptyShould(true);

    private CqrsRules() {
    }

    private static DescribedPredicate<JavaMethod> areHandleMethods() {
        return DescribedPredicate.describe("handle methods of Command.Handler implementations",
                method -> method.getName().equals("handle") && !method.getModifiers().contains(JavaModifier.BRIDGE)
                        && !method.getModifiers().contains(JavaModifier.SYNTHETIC)
                        && method.getOwner().isAssignableTo(Command.Handler.class));
    }

    private static DescribedPredicate<JavaClass> implementHandler() {
        return DescribedPredicate.describe("implement Command.Handler",
                javaClass -> javaClass.isAssignableTo(Command.Handler.class) && !javaClass.isInterface());
    }

    private static ArchCondition<JavaClass> beRecords() {
        return new ArchCondition<>("be records") {
            @Override
            public void check(JavaClass javaClass, ConditionEvents events) {
                boolean record = javaClass.isAssignableTo(Record.class);
                events.add(new SimpleConditionEvent(javaClass, record,
                        javaClass.getName() + (record ? " is" : " is not") + " a record"));
            }
        };
    }

    private static ArchCondition<JavaMethod> beTransactional(boolean readOnly) {
        String expected = readOnly ? "@Transactional(readOnly = true)" : "@Transactional";
        return new ArchCondition<>("be annotated with " + expected) {
            @Override
            public void check(JavaMethod method, ConditionEvents events) {
                boolean ok = method.tryGetAnnotationOfType(Transactional.class)
                        .map(transactional -> transactional.readOnly() == readOnly).orElse(false);
                events.add(new SimpleConditionEvent(method, ok,
                        method.getFullName() + (ok ? " is" : " is not") + " annotated with " + expected));
            }
        };
    }
}
