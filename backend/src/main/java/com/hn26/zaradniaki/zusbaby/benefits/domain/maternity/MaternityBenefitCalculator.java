package com.hn26.zaradniaki.zusbaby.benefits.domain.maternity;

import com.hn26.zaradniaki.zusbaby.benefits.domain.LeaveParameters;
import com.hn26.zaradniaki.zusbaby.benefits.domain.MaternityParameters;
import com.hn26.zaradniaki.zusbaby.benefits.domain.insurance.ResolvedInsurance;
import com.hn26.zaradniaki.zusbaby.shared.domain.Check;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Stream;

/**
 * Maternity benefit calculator for both parents, as the calculator screen of
 * the frontend prototype shows it ({@code simOut()}):
 * <ul>
 * <li>the simulation of leaves and amounts,</li>
 * <li>checks of the mother's insurance titles, and of the father's when they
 * say more than "insured" (a problem, or several titles), before the
 * simulation's checks; "no ZUS title" of a parent is left to the
 * simulation,</li>
 * <li>when the mother has no ZUS title, the benefit she gets instead, which
 * replaces the simulation's check of the mother.</li>
 * </ul>
 */
public final class MaternityBenefitCalculator {

    private static final String MOTHER = "Mama: ";
    private static final String FATHER = "Tata: ";

    private final MaternityBenefitSimulator simulator;
    private final AlternativeBenefitPolicy alternativePolicy;

    public MaternityBenefitCalculator(MaternityBenefitSimulator simulator, AlternativeBenefitPolicy alternativePolicy) {
        this.simulator = Objects.requireNonNull(simulator, "simulator");
        this.alternativePolicy = Objects.requireNonNull(alternativePolicy, "alternativePolicy");
    }

    public MaternityBenefit calculate(MaternityCase family, MaternityParameters parameters,
            LeaveParameters leaveParameters) {
        MaternitySimulation simulation = simulator.simulate(family, parameters, leaveParameters);
        Optional<AlternativeBenefit> alternative = alternativePolicy.forMother(family.mother(), family.children(),
                parameters);
        List<Check> checks = new ArrayList<>();
        titleChecks(family.mother(), MOTHER).forEach(checks::add);
        ResolvedInsurance father = family.father();
        titleChecks(father, FATHER).filter(check -> check.level() != Check.Level.OK || father.parts().size() > 1)
                .forEach(checks::add);
        simulation.checks().stream()
                .filter(check -> alternative.isEmpty() || !check.message().startsWith(MOTHER))
                .forEach(checks::add);
        return new MaternityBenefit(simulation, checks, alternative.orElse(null));
    }

    /**
     * Checks of a parent's insurance titles. Without any ZUS title the simulation
     * explains the missing benefit, so the titles' negative checks are dropped.
     */
    private static Stream<Check> titleChecks(ResolvedInsurance insurance, String prefix) {
        return insurance.checks().stream()
                .filter(check -> insurance.mainTitle() != null || !check.isNegative())
                .map(check -> new Check(check.level(), prefix + check.message()));
    }
}
