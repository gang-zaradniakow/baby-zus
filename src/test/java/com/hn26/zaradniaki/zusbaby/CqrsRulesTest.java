package com.hn26.zaradniaki.zusbaby;

import static org.assertj.core.api.Assertions.assertThat;

import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.tngtech.archunit.lang.ArchRule;
import java.util.stream.Stream;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;

/**
 * Proves that every CQRS rule accepts code following the conventions and
 * rejects code breaking them.
 */
class CqrsRulesTest {

    private static final JavaClasses GOOD = new ClassFileImporter().importPackages("com.hn26.archfixtures.good");
    private static final JavaClasses BAD = new ClassFileImporter().importPackages("com.hn26.archfixtures.bad");

    static Stream<ArchRule> rules() {
        return Stream.of(CqrsRules.handlersLiveInHandlerPackage, CqrsRules.handlersEndWithHandler, CqrsRules.commandsAndQueriesLiveInTheirPackages,
                CqrsRules.queriesEndWithQuery, CqrsRules.commandsAndQueriesAreRecords,
                CqrsRules.commandHandlersAreTransactional, CqrsRules.queryHandlersAreReadOnly,
                CqrsRules.controllersUseOnlyPipeline);
    }

    @ParameterizedTest
    @MethodSource("rules")
    void acceptsCodeFollowingConventions(ArchRule rule) {
        assertThat(rule.evaluate(GOOD).hasViolation()).as(rule.getDescription()).isFalse();
    }

    @ParameterizedTest
    @MethodSource("rules")
    void rejectsCodeBreakingConventions(ArchRule rule) {
        assertThat(rule.evaluate(BAD).hasViolation()).as(rule.getDescription()).isTrue();
    }
}
