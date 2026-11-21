package com.hn26.zaradniaki.zusbaby.legalrules.infrastructure.catalog;

import com.hn26.zaradniaki.zusbaby.legalrules.domain.ParameterSet;
import com.hn26.zaradniaki.zusbaby.legalrules.domain.ParameterSetRepository;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import org.springframework.stereotype.Repository;

/**
 * Adapter of the {@link ParameterSetRepository} port: versions are part of the
 * code (one class per legal state). A new version is added to
 * {@link #VERSIONS}.
 */
@Repository
class InCodeParameterSetRepository implements ParameterSetRepository {

    static final List<ParameterSet> VERSIONS = List.of(LegalState2026.parameterSet());

    private final List<ParameterSet> versions;

    InCodeParameterSetRepository() {
        this(VERSIONS);
    }

    InCodeParameterSetRepository(List<ParameterSet> versions) {
        long distinct = versions.stream().map(ParameterSet::getVersion).distinct().count();
        if (distinct != versions.size()) {
            throw new IllegalStateException("Duplicate legal parameter versions: " + versions.stream()
                    .map(set -> String.valueOf(set.getVersion())).collect(Collectors.joining(", ")));
        }
        this.versions = versions.stream().sorted(Comparator.comparingInt(ParameterSet::getVersion)).toList();
    }

    @Override
    public Optional<ParameterSet> findEffectiveOn(LocalDate day) {
        return versions.stream().filter(set -> set.hasStartedOn(day))
                .max(Comparator.comparingInt(ParameterSet::getVersion));
    }
}
