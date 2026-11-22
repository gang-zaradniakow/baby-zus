package com.hn26.zaradniaki.zusbaby;

import static org.assertj.core.api.Assertions.assertThat;

import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import org.junit.jupiter.api.Test;

class ApiFirstRulesTest {

    private static final JavaClasses GOOD = new ClassFileImporter().importPackages("com.hn26.archfixtures.good");
    private static final JavaClasses BAD = new ClassFileImporter().importPackages("com.hn26.archfixtures.bad");

    @Test
    void acceptsControllerImplementingGeneratedApi() {
        assertThat(ApiFirstRules.controllersImplementGeneratedApi.evaluate(GOOD).hasViolation()).isFalse();
    }

    @Test
    void rejectsHandWrittenController() {
        assertThat(ApiFirstRules.controllersImplementGeneratedApi.evaluate(BAD).hasViolation()).isTrue();
    }
}
