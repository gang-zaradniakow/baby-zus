package com.hn26.zaradniaki.zusbaby.benefits.domain.maternity;

import com.hn26.zaradniaki.zusbaby.shared.domain.Check;
import java.util.List;
import java.util.Objects;

/**
 * What the maternity benefit calculator shows.
 * @param simulation leave split, timeline and amounts
 * @param checks insurance of both parents and the simulation's checks (Polish)
 * @param alternative benefit the mother gets instead of the ZUS one, may be
 *            {@code null}
 */
public record MaternityBenefit(MaternitySimulation simulation, List<Check> checks, AlternativeBenefit alternative) {

    public MaternityBenefit {
        Objects.requireNonNull(simulation, "simulation");
        checks = List.copyOf(checks);
    }
}
