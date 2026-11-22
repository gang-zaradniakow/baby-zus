package com.hn26.zaradniaki.zusbaby.benefits.domain.maternity;

import static com.hn26.zaradniaki.zusbaby.shared.domain.PolishFormat.money;

import com.hn26.zaradniaki.zusbaby.benefits.domain.LeaveParameters;
import com.hn26.zaradniaki.zusbaby.benefits.domain.MaternityParameters;
import com.hn26.zaradniaki.zusbaby.benefits.domain.insurance.InsuranceTitle;
import com.hn26.zaradniaki.zusbaby.benefits.domain.insurance.ResolvedInsurance;
import com.hn26.zaradniaki.zusbaby.benefits.domain.leave.AdoptionLeave;
import com.hn26.zaradniaki.zusbaby.benefits.domain.leave.AdoptionLeavePolicy;
import com.hn26.zaradniaki.zusbaby.benefits.domain.leave.LeaveDimensionsPolicy;
import com.hn26.zaradniaki.zusbaby.benefits.domain.leave.SupplementaryLeavePolicy;
import com.hn26.zaradniaki.zusbaby.shared.domain.Check;
import com.hn26.zaradniaki.zusbaby.shared.domain.DateRange;
import com.hn26.zaradniaki.zusbaby.shared.domain.Rate;
import com.hn26.zaradniaki.zusbaby.shared.domain.Weeks;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

/**
 * Splits maternity and parental leave between the parents and lays the leaves
 * out on a timeline, same rules and messages as {@code simulate()} of the
 * frontend prototype:
 * <ul>
 * <li>the first 14 weeks of maternity leave after a birth are the mother's; the
 * father may take over the rest when both are insured,</li>
 * <li>each parent has 9 non-transferable weeks of parental leave; the father's
 * own 9 weeks are always paid 70%,</li>
 * <li>supplementary leave for a premature baby follows the maternity leave (the
 * father's when the mother is not insured),</li>
 * <li>paternity leave starts on the day of birth, alongside the mother's
 * maternity leave,</li>
 * <li>the 81.5% variant needs an insured mother.</li>
 * </ul>
 */
public final class MaternityBenefitSimulator {

    private static final BigDecimal DAYS_IN_WEEK = BigDecimal.valueOf(7);

    private final LeaveDimensionsPolicy dimensions;
    private final AdoptionLeavePolicy adoptionPolicy;
    private final SupplementaryLeavePolicy supplementaryPolicy;

    public MaternityBenefitSimulator(LeaveDimensionsPolicy dimensions, AdoptionLeavePolicy adoptionPolicy,
            SupplementaryLeavePolicy supplementaryPolicy) {
        this.dimensions = Objects.requireNonNull(dimensions, "dimensions");
        this.adoptionPolicy = Objects.requireNonNull(adoptionPolicy, "adoptionPolicy");
        this.supplementaryPolicy = Objects.requireNonNull(supplementaryPolicy, "supplementaryPolicy");
    }

    public MaternitySimulation simulate(MaternityCase family, MaternityParameters parameters,
            LeaveParameters leaveParameters) {
        List<Check> checks = new ArrayList<>();
        List<String> notes = new ArrayList<>();
        int children = Math.clamp(family.children(), 1, 5);
        boolean adoption = family.situation() == CareSituation.ADOPTION;

        Weeks maternity;
        Weeks parental;
        if (adoption) {
            AdoptionLeave leave = adoptionPolicy.leave(children, family.zaZyciem(), family.adoption(),
                    leaveParameters);
            maternity = leave.maternityWeeks();
            parental = leave.parentalWeeks();
            notes.add(leave.note());
        } else {
            maternity = dimensions.maternityWeeks(children, leaveParameters);
            parental = dimensions.parentalWeeks(children, family.zaZyciem(), leaveParameters);
        }

        boolean motherInsured = isInsured(family.mother()) && !isBlocked(family.mother(), parameters);
        boolean fatherInsured = isInsured(family.father()) && !isBlocked(family.father(), parameters);
        checks.add(motherCheck(family.mother(), parameters));
        checks.add(fatherCheck(family.father(), parameters));

        if (maternity.isZero()) {
            return new MaternitySimulation(maternity, parental, Weeks.ZERO, ParentLeaveShare.NONE,
                    ParentLeaveShare.NONE, false, List.of(), checks, notes);
        }

        FatherLeaveChoices choices = family.fatherChoices();
        Weeks motherOnly = adoption ? Weeks.ZERO : parameters.motherOnlyMaternityWeeks();
        Weeks fatherMaternity = motherInsured && fatherInsured
                ? clamp(Weeks.of(Math.max(0, choices.maternityWeeksTaken())), maternity.minus(motherOnly))
                : Weeks.ZERO;
        Weeks motherMaternity = motherInsured ? maternity.minus(fatherMaternity) : Weeks.ZERO;
        Weeks supplementary = !adoption && family.preterm() != null
                ? supplementaryPolicy.leave(family.preterm(), leaveParameters).weeks()
                : Weeks.ZERO;

        Weeks nonTransferable = parameters.nonTransferableParentalWeeks();
        Weeks fatherParental = fatherInsured
                ? clamp(Weeks.of(Math.max(0, choices.parentalWeeks())), parental.minus(nonTransferable))
                : Weeks.ZERO;
        Weeks motherParental = motherInsured
                ? parental.minus(fatherParental).min(parental.minus(nonTransferable))
                : Weeks.ZERO;
        if (fatherInsured && fatherParental.compareTo(nonTransferable) < 0) {
            notes.add("Tata wykorzystuje %s z %s nieprzenoszalnych tygodni — %s tyg. przepadnie.".formatted(
                    number(fatherParental), number(nonTransferable), number(nonTransferable.minus(fatherParental))));
        }

        boolean averaged = family.variant() == BenefitVariant.AVERAGED && motherInsured;
        if (family.variant() == BenefitVariant.AVERAGED && !motherInsured) {
            notes.add("Wariant 81,5% wymaga wniosku ubezpieczonej mamy — liczymy wariant 100% + 70%.");
        }
        Rate maternityRate = averaged ? parameters.averagedRate() : parameters.maternityRate();
        Rate parentalRate = averaged ? parameters.averagedRate() : parameters.parentalRate();

        Timeline timeline = new Timeline(family.startDate());
        timeline.add(Parent.MOTHER, adoption ? "Urlop na warunkach macierzyńskiego" : "Urlop macierzyński",
                motherMaternity, maternityRate);
        if (!fatherMaternity.isZero()) {
            timeline.fatherDays = Math.max(timeline.fatherDays, timeline.motherDays);
            timeline.add(Parent.FATHER, "Część urlopu macierzyńskiego (przejęta)", fatherMaternity, maternityRate);
        }
        long afterMaternity = Math.max(timeline.motherDays, timeline.fatherDays);
        if (!supplementary.isZero()) {
            if (motherInsured) {
                timeline.motherDays = afterMaternity;
                timeline.add(Parent.MOTHER, "Uzupełniający urlop macierzyński", supplementary,
                        parameters.supplementaryRate());
            } else if (fatherInsured) {
                timeline.fatherDays = afterMaternity;
                timeline.add(Parent.FATHER, "Uzupełniający urlop macierzyński", supplementary,
                        parameters.supplementaryRate());
            }
        }
        if (!motherParental.isZero()) {
            long motherSupplementaryDays = !supplementary.isZero() && motherInsured ? days(supplementary) : 0;
            timeline.motherDays = Math.max(timeline.motherDays, afterMaternity + motherSupplementaryDays);
            timeline.add(Parent.MOTHER, "Urlop rodzicielski", motherParental, parentalRate);
        }
        if (!fatherParental.isZero()) {
            timeline.fatherDays = Math.max(Math.max(timeline.fatherDays, timeline.motherDays), afterMaternity);
            Weeks own = fatherParental.min(nonTransferable);
            // the father's own non-transferable weeks are always paid at the parental rate
            // (70%)
            timeline.add(Parent.FATHER, "Urlop rodzicielski", own, parameters.parentalRate());
            timeline.add(Parent.FATHER, "Urlop rodzicielski", fatherParental.minus(own), parentalRate);
        }
        if (fatherInsured && choices.paternityLeave()) {
            timeline.addFromStart(Parent.FATHER, "Urlop ojcowski", parameters.paternityWeeks(),
                    parameters.paternityRate());
        }
        if (averaged) {
            notes.add(
                    "Warunek 81,5%: co najmniej 1 dzień urlopu rodzicielskiego musi przypaść w 1. roku życia dziecka; 9 tygodni taty zawsze 70%.");
        }
        return new MaternitySimulation(maternity, parental, supplementary,
                new ParentLeaveShare(motherMaternity, motherParental),
                new ParentLeaveShare(fatherMaternity, fatherParental), averaged, timeline.segments, checks, notes);
    }

    private static boolean isInsured(ResolvedInsurance insurance) {
        return insurance.mainTitle() != null;
    }

    private static boolean isBlocked(ResolvedInsurance insurance, MaternityParameters parameters) {
        return insurance.mainTitle() == InsuranceTitle.SELF_EMPLOYMENT
                && insurance.blockingDebt().isGreaterThan(parameters.debtThreshold());
    }

    private static Check motherCheck(ResolvedInsurance mother, MaternityParameters parameters) {
        if (!isInsured(mother)) {
            return Check.no(mother.agriculturalInsurance()
                    ? "Mama: ubezpieczenie w KRUS — zasiłek macierzyński wypłaca KRUS, nie ZUS."
                    : "Mama: brak ubezpieczenia chorobowego w dniu porodu/przyjęcia — zasiłek macierzyński z ZUS nie przysługuje (zamiast niego: świadczenie rodzicielskie z gminy).");
        }
        if (isBlocked(mother, parameters)) {
            return Check.no(
                    "Mama: zaległość w składkach %s > %s — zasiłek wstrzymany do spłaty całości; brak spłaty w 6 mies. = utrata prawa."
                            .formatted(money(mother.blockingDebt()), money(parameters.debtThreshold())));
        }
        return Check.ok("Mama: ubezpieczenie chorobowe %s — zasiłek przysługuje (bez okresu wyczekiwania).".formatted(
                mother.mainTitle() == InsuranceTitle.EMPLOYMENT ? "obowiązkowe (pracownica)" : "dobrowolne"));
    }

    private static Check fatherCheck(ResolvedInsurance father, MaternityParameters parameters) {
        if (!isInsured(father)) {
            return Check.info(father.agriculturalInsurance()
                    ? "Tata: KRUS — zasiłek za urlop ojcowski / rodzicielski nie z ZUS."
                    : "Tata: bez ubezpieczenia chorobowego — nie pobiera zasiłku (urlop ojcowski i 9 tygodni przepadają).");
        }
        if (isBlocked(father, parameters)) {
            return Check.no("Tata: zaległość w składkach %s — zasiłek wstrzymany do spłaty."
                    .formatted(money(father.blockingDebt())));
        }
        return Check.ok("Tata: ubezpieczony — może wziąć urlop ojcowski, swoje 9 tygodni i część urlopu mamy.");
    }

    private static Weeks clamp(Weeks value, Weeks max) {
        return value.min(max);
    }

    private static long days(Weeks weeks) {
        return weeks.value().multiply(DAYS_IN_WEEK).setScale(0, RoundingMode.HALF_UP).longValueExact();
    }

    private static String number(Weeks weeks) {
        return weeks.value().toPlainString();
    }

    /**
     * Places leaves of each parent one after another, counting days from the start
     * date.
     */
    private static final class Timeline {

        private final LocalDate start;
        private final List<LeaveSegment> segments = new ArrayList<>();
        private long motherDays;
        private long fatherDays;

        Timeline(LocalDate start) {
            this.start = start;
        }

        void add(Parent parent, String label, Weeks weeks, Rate rate) {
            if (weeks.isZero()) {
                return;
            }
            long offset = parent == Parent.MOTHER ? motherDays : fatherDays;
            long length = days(weeks);
            segments.add(segment(parent, label, weeks, rate, offset, length));
            if (parent == Parent.MOTHER) {
                motherDays += length;
            } else {
                fatherDays += length;
            }
        }

        /** Leave starting on the start date, without moving the parent's next leave. */
        void addFromStart(Parent parent, String label, Weeks weeks, Rate rate) {
            if (!weeks.isZero()) {
                segments.add(segment(parent, label, weeks, rate, 0, days(weeks)));
            }
        }

        private LeaveSegment segment(Parent parent, String label, Weeks weeks, Rate rate, long offset, long length) {
            Weeks rounded = new Weeks(weeks.value().setScale(1, RoundingMode.HALF_UP));
            return new LeaveSegment(parent, label, rounded, rate, Rate.ONE,
                    DateRange.startingAt(start.plusDays(offset), length));
        }
    }
}
