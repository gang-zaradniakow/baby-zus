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
import java.util.List;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.RestController;

/**
 * CQRS conventions (plan, section 2.4):
 * <ul>
 * <li>commands are records in a {@code command} package, queries are records in
 * a {@code query} package ({@code application.*} when used only by the module,
 * {@code api.*} when published to other modules),</li>
 * <li>handlers live in {@code application.handler}; a handler of a command is
 * {@code @Transactional}, a handler of a query is
 * {@code @Transactional(readOnly = true)},</li>
 * <li>controllers talk to the application only through the Pipeline.</li>
 * </ul>
 * Shared by {@link ArchitectureTest} (production code) and
 * {@code CqrsRulesTest} (fixtures).
 */
public final class CqrsRules {

    private static final String COMMANDS = "..command..";
    private static final String QUERIES = "..query..";
    private static final String COMMAND_SEGMENT = "command";
    private static final String QUERY_SEGMENT = "query";
    private static final String HANDLERS = "..application.handler..";

    /** Handlers live in application.handler. */
    public static final ArchRule handlersLiveInHandlerPackage = classes().that(implementHandler()).should()
            .resideInAPackage(HANDLERS).because("handlers belong to application.handler").allowEmptyShould(true);

    /**
     * Handler names end with "Handler", without the "Query" suffix:
     * GetCurrentLegalParametersHandler.
     */
    public static final ArchRule handlersEndWithHandler = classes().that(implementHandler()).should()
            .haveSimpleNameEndingWith("Handler").andShould().haveSimpleNameNotEndingWith("QueryHandler")
            .because("a handler is named after its query without the Query suffix, plus Handler")
            .allowEmptyShould(true);

    /** Commands and queries live in a command or query package. */
    public static final ArchRule commandsAndQueriesLiveInTheirPackages = classes().that(areCommandsOrQueries())
            .should().resideInAnyPackage(COMMANDS, QUERIES)
            .because("commands belong to a command package and queries to a query package").allowEmptyShould(true);

    /** Query names end with "Query", e.g. GetCurrentLegalParametersQuery. */
    public static final ArchRule queriesEndWithQuery = classes().that(areCommandsOrQueries()).and()
            .resideInAPackage(QUERIES).should().haveSimpleNameEndingWith("Query")
            .because("every query is named *Query").allowEmptyShould(true);

    /** Commands and queries are immutable records. */
    public static final ArchRule commandsAndQueriesAreRecords = classes().that(areCommandsOrQueries())
            .should(beRecords()).allowEmptyShould(true);

    /** A handler of a command writes in a read-write transaction. */
    public static final ArchRule commandHandlersAreTransactional = methods().that(handle(COMMAND_SEGMENT))
            .should(beTransactional(false)).allowEmptyShould(true);

    /** A handler of a query only reads, in a read-only transaction. */
    public static final ArchRule queryHandlersAreReadOnly = methods().that(handle(QUERY_SEGMENT))
            .should(beTransactional(true)).allowEmptyShould(true);

    /** Controllers talk to the application only through the Pipeline. */
    public static final ArchRule controllersUseOnlyPipeline = noClasses().that()
            .areAnnotatedWith(RestController.class).should().dependOnClassesThat(implementHandler()).orShould()
            .dependOnClassesThat().resideInAnyPackage("..persistence..", "..domain..")
            .because("controllers send commands and queries through Pipeline (plan, section 2.4)")
            .allowEmptyShould(true);

    private CqrsRules() {
    }

    private static DescribedPredicate<JavaClass> implementHandler() {
        return DescribedPredicate.describe("implement Command.Handler",
                javaClass -> javaClass.isAssignableTo(Command.Handler.class) && !javaClass.isInterface());
    }

    private static DescribedPredicate<JavaClass> areCommandsOrQueries() {
        return DescribedPredicate.describe("are commands or queries",
                javaClass -> javaClass.isAssignableTo(Command.class) && !javaClass.isInterface()
                        && !javaClass.isAssignableTo(Command.Handler.class));
    }

    /**
     * {@code handle} methods (not bridges) whose argument lives in a package named
     * {@code segment}.
     */
    private static DescribedPredicate<JavaMethod> handle(String segment) {
        return DescribedPredicate.describe("handle a type from a '" + segment + "' package",
                method -> method.getName().equals("handle") && !method.getModifiers().contains(JavaModifier.BRIDGE)
                        && !method.getModifiers().contains(JavaModifier.SYNTHETIC)
                        && method.getOwner().isAssignableTo(Command.Handler.class)
                        && method.getRawParameterTypes().size() == 1 && List
                                .of(method.getRawParameterTypes().getFirst().getPackageName().split("\\."))
                                .contains(segment));
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
