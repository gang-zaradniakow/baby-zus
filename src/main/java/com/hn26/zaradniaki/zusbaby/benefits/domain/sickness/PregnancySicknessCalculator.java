package com.hn26.zaradniaki.zusbaby.benefits.domain.sickness;

import static com.hn26.zaradniaki.zusbaby.shared.domain.PolishFormat.money;

import com.hn26.zaradniaki.zusbaby.benefits.domain.IncomeTaxAdvance;
import com.hn26.zaradniaki.zusbaby.benefits.domain.SicknessParameters;
import com.hn26.zaradniaki.zusbaby.benefits.domain.insurance.InsuranceTitle;
import com.hn26.zaradniaki.zusbaby.benefits.domain.insurance.ResolvedInsurance;
import com.hn26.zaradniaki.zusbaby.benefits.domain.insurance.TitleBase;
import com.hn26.zaradniaki.zusbaby.shared.domain.Check;
import com.hn26.zaradniaki.zusbaby.shared.domain.Money;
import com.hn26.zaradniaki.zusbaby.shared.domain.Rate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Pay for a sick leave in pregnancy (Poradnik ZUS 2026, s. 23–25), same rules
 * and messages as {@code chorobowyMulti()} / {@code chorobowyCiaza()} of the
 * frontend prototype. Each insurance title is calculated separately from its
 * daily base (base / 30):
 * <ul>
 * <li>employment: sick pay from the employer for the remaining sick-pay days of
 * the year (33, or 14 from the age of 50), then the sickness benefit,</li>
 * <li>mandate contract and own firm: sickness benefit from the first day,</li>
 * <li>after the benefit period (270 days) the rehabilitation benefit, up to 12
 * months,</li>
 * <li>the waiting period (30 days mandatory, 90 days voluntary insurance) is
 * only explained.</li>
 * </ul>
 * Deviation from the prototype: when the only title is blocked by contribution
 * debt, the debt is explained instead of "no sickness insurance" (the prototype
 * shows that misleading message in this case).
 */
public final class PregnancySicknessCalculator {

    private static final int DAYS_IN_BENEFIT_MONTH = 30;
    private static final int MAX_USED_SICK_PAY_DAYS = 400;

    public PregnancySickness calculate(ResolvedInsurance insurance, SickLeave leave, SicknessParameters parameters) {
        List<Check> checks = new ArrayList<>(insurance.checks());
        List<SicknessPayPart> parts = new ArrayList<>();
        if (insurance.parts().isEmpty()) {
            if (insurance.blockingDebt().isGreaterThan(Money.ZERO)) {
                checks.add(Check.no("Zaległość w składkach %s — zasiłek wstrzymany do spłaty."
                        .formatted(money(insurance.blockingDebt()))));
            } else if (checks.stream().noneMatch(Check::isNegative)) {
                checks.add(Check.no("Brak ubezpieczenia chorobowego — zasiłek chorobowy nie przysługuje."));
            }
            return new PregnancySickness(checks, parts, Money.ZERO, Money.ZERO);
        }
        boolean severalTitles = insurance.parts().size() > 1;
        for (TitleBase title : insurance.parts()) {
            String checkPrefix = severalTitles ? title.title().label() + ": " : "";
            String labelPrefix = severalTitles ? title.title().label() + " — " : "";
            waitingPeriodCheck(title.title(), leave, parameters)
                    .ifPresent(check -> checks.add(new Check(check.level(), checkPrefix + check.message())));
            forTitle(title, leave, parameters).forEach(part -> parts.add(new SicknessPayPart(part.title(),
                    labelPrefix + part.label(), part.days(), part.rate(), part.amount())));
        }
        Money total = parts.stream().map(SicknessPayPart::amount).reduce(Money.ZERO, Money::plus);
        return new PregnancySickness(checks, parts, total,
                IncomeTaxAdvance.net(total, parameters.incomeTaxAdvanceRate()));
    }

    private static Optional<Check> waitingPeriodCheck(InsuranceTitle title, SickLeave leave,
            SicknessParameters parameters) {
        boolean employment = title == InsuranceTitle.EMPLOYMENT;
        int waitingDays = employment ? parameters.waitingPeriodMandatoryDays() : parameters.waitingPeriodVoluntaryDays();
        if (leave.insuredDays() >= waitingDays) {
            return Optional.empty();
        }
        return Optional.of(Check.no(
                "Okres wyczekiwania: prawo do zasiłku po %d dniach %s ubezpieczenia (masz %d dni). Pierwsze dni L4 mogą być bez zasiłku."
                        .formatted(waitingDays, employment ? "obowiązkowego" : "dobrowolnego", leave.insuredDays())));
    }

    private static List<SicknessPayPart> forTitle(TitleBase title, SickLeave leave, SicknessParameters parameters) {
        List<SicknessPayPart> parts = new ArrayList<>();
        Money daily = title.base().dividedBy(DAYS_IN_BENEFIT_MONTH);
        int remaining = leave.days();
        int sickPay = 0;
        boolean employment = title.title() == InsuranceTitle.EMPLOYMENT;
        if (employment) {
            int yearlySickPay = leave.aged50OrMore() ? parameters.sickPayDaysAge50() : parameters.sickPayDays();
            int left = Math.max(0, yearlySickPay - Math.min(leave.usedSickPayDays(), MAX_USED_SICK_PAY_DAYS));
            sickPay = Math.min(Math.min(remaining, left), parameters.pregnancyBenefitPeriodDays());
            if (sickPay > 0) {
                parts.add(part(title.title(), "Wynagrodzenie chorobowe (płaci pracodawca)", sickPay, Rate.ONE, daily));
            }
            remaining -= sickPay;
        }
        int benefit = Math.min(remaining, Math.max(0, parameters.pregnancyBenefitPeriodDays() - sickPay));
        if (benefit > 0) {
            parts.add(part(title.title(),
                    employment
                            ? "Zasiłek chorobowy (płatnik lub ZUS)"
                            : "Zasiłek chorobowy (od 1. dnia — ZUS lub płatnik)",
                    benefit, parameters.pregnancySicknessRate(), daily));
        }
        remaining -= benefit;
        if (remaining > 0) {
            int rehabilitation = Math.min(remaining, parameters.rehabilitationMaxMonths() * DAYS_IN_BENEFIT_MONTH);
            parts.add(part(title.title(), "Świadczenie rehabilitacyjne (po 270 dniach, decyzja lekarza orzecznika)",
                    rehabilitation, parameters.pregnancyRehabilitationRate(), daily));
        }
        return parts;
    }

    private static SicknessPayPart part(InsuranceTitle title, String label, int days, Rate rate, Money daily) {
        return new SicknessPayPart(title, label, days, rate, daily.times(days).times(rate));
    }
}
