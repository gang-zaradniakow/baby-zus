package com.hn26.zaradniaki.zusbaby;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.modulith.core.ApplicationModule;
import org.springframework.modulith.core.ApplicationModules;
import org.springframework.modulith.docs.Documenter;

class ModularityTest {

    private static final ApplicationModules MODULES = ApplicationModules.of(ZusBabyApplication.class);

    @Test
    void verifiesModuleBoundaries() {
        MODULES.verify();
    }

    @Test
    void detectsAllBoundedContexts() {
        assertThat(MODULES.stream().map(ApplicationModule::getIdentifier).map(Object::toString)).containsExactlyInAnyOrder(
                "shared", "api", "legalrules", "calendar", "benefits", "guide", "applications", "correspondence",
                "insuredaccount", "identity", "knowledge");
    }

    @Test
    void writesModuleDocumentation() {
        // target/spring-modulith-docs: C4/PlantUML diagrams and module canvases
        new Documenter(MODULES).writeDocumentation();
    }
}
