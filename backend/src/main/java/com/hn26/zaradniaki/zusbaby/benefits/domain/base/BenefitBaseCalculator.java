package com.hn26.zaradniaki.zusbaby.benefits.domain.base;

import static com.hn26.zaradniaki.zusbaby.shared.domain.PolishFormat.money;
import static com.hn26.zaradniaki.zusbaby.shared.domain.PolishFormat.percent;

import com.hn26.zaradniaki.zusbaby.benefits.domain.BenefitParameters;
import com.hn26.zaradniaki.zusbaby.benefits.domain.insurance.InsuranceTitle;
import com.hn26.zaradniaki.zusbaby.shared.domain.Money;
import java.util.List;

/**
 * Benefit base from the payer's certificate (Z-3 / Z-3a), same rules and
 * messages as {@code podstawaZ3()} in the frontend prototype: average of the
 * counted months minus employee contributions; full-time employment gets at
 * least the minimum base, other titles are capped at the voluntary sickness
 * insurance limit.
 */
public final class BenefitBaseCalculator {

    public BenefitBase fromMonthlyPay(List<MonthlyPay> months, InsuranceTitle title, boolean fullTime,
            BenefitParameters parameters) {
        List<Money> counted = months.stream().filter(MonthlyPay::counts).map(MonthlyPay::amount).toList();
        if (counted.isEmpty()) {
            return new BenefitBase(Money.ZERO, Money.ZERO, 0, "Wpisz co najmniej jeden miesiąc.");
        }
        Money average = counted.stream().reduce(Money.ZERO, Money::plus).dividedBy(counted.size());
        Money base = average.times(parameters.employeeContributionRate().complement());
        StringBuilder note = new StringBuilder("Średnia z %d mies. (%s) minus %s%% składek."
                .formatted(counted.size(), money(average), percent(parameters.employeeContributionRate())));
        if (title == InsuranceTitle.EMPLOYMENT && fullTime && base.isLessThan(parameters.minimumBenefitBase())) {
            base = parameters.minimumBenefitBase();
            note.append(" Zastosowano minimalną podstawę dla pełnego etatu.");
        }
        if (title != InsuranceTitle.EMPLOYMENT && base.isGreaterThan(parameters.maximumVoluntaryBenefitBase())) {
            base = parameters.maximumVoluntaryBenefitBase();
            note.append(" Zastosowano limit podstawy dobrowolnego chorobowego.");
        }
        return new BenefitBase(base, average, counted.size(), note.toString());
    }
}
