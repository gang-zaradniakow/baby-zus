package com.hn26.zaradniaki.zusbaby.legalrules.domain;

import java.time.LocalDate;
import java.util.Objects;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.ToString;

/**
 * Aggregate: one version of all legal parameters, in force from
 * {@code validFrom} until a newer version starts. Versions are defined in code;
 * a new legal state is a new version, never an edit of an old one.
 */
@Getter
@ToString
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public final class ParameterSet {

    @EqualsAndHashCode.Include
    private final int version;
    private final LocalDate validFrom;
    private final String description;
    private final LegalParameters parameters;

    private ParameterSet(int version, LocalDate validFrom, String description, LegalParameters parameters) {
        if (version < 1) {
            throw new IllegalArgumentException("Version must be positive, was " + version);
        }
        if (description == null || description.isBlank()) {
            throw new InvalidLegalParametersException("Opisz stan prawny, z którego pochodzą parametry.");
        }
        this.version = version;
        this.validFrom = Objects.requireNonNull(validFrom, "validFrom");
        this.description = description.strip();
        this.parameters = Objects.requireNonNull(parameters, "parameters");
    }

    public static ParameterSet of(int version, LocalDate validFrom, String description, LegalParameters parameters) {
        return new ParameterSet(version, validFrom, description, parameters);
    }

    /**
     * Whether the version has already started on {@code day} (a newer version may
     * still replace it).
     */
    public boolean hasStartedOn(LocalDate day) {
        return !validFrom.isAfter(day);
    }
}
