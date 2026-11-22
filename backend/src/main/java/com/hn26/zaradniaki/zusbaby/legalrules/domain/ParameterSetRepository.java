package com.hn26.zaradniaki.zusbaby.legalrules.domain;

import java.time.LocalDate;
import java.util.Optional;

/** Port: all known versions of the legal parameters. */
public interface ParameterSetRepository {

    /**
     * Version effective (in force) on {@code day}: the newest version whose
     * {@code validFrom} is not later than {@code day}. Empty when the first version
     * starts after {@code day}.
     */
    Optional<ParameterSet> findEffectiveOn(LocalDate day);
}
