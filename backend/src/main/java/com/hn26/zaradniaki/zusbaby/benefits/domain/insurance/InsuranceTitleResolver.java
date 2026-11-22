package com.hn26.zaradniaki.zusbaby.benefits.domain.insurance;

import static com.hn26.zaradniaki.zusbaby.shared.domain.PolishFormat.money;

import com.hn26.zaradniaki.zusbaby.benefits.domain.BenefitParameters;
import com.hn26.zaradniaki.zusbaby.shared.domain.Check;
import com.hn26.zaradniaki.zusbaby.shared.domain.Money;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Decides which insurance titles give a benefit and with what base (Poradnik
 * ZUS 2026, s. 9–14). Same rules and messages as {@code resolvePerson()} in the
 * frontend prototype:
 * <ul>
 * <li>employment: at least the minimum base when paid at least the minimum
 * wage,</li>
 * <li>employment at minimum wage excludes sickness insurance from a mandate
 * contract and a firm,</li>
 * <li>mandate contract and firm together: only the mandatorily insured title
 * counts (the mandate contract when it pays at least the minimum wage,
 * otherwise the firm),</li>
 * <li>student on a mandate contract, startup relief, no voluntary sickness
 * insurance: no benefit from that title,</li>
 * <li>voluntary base capped; firm debt above the threshold blocks the benefit
 * from the firm.</li>
 * </ul>
 */
public final class InsuranceTitleResolver {

    public ResolvedInsurance resolve(InsuranceTitles titles, BenefitParameters parameters) {
        return new Resolution(titles, parameters).resolve();
    }

    /** State of one resolution: collected parts and checks. */
    private static final class Resolution {

        private final InsuranceTitles titles;
        private final BenefitParameters parameters;
        private final List<TitleBase> parts = new ArrayList<>();
        private final List<Check> checks = new ArrayList<>();
        private final boolean employmentAtMinimumWage;
        private Check blockedFirmCheck;

        Resolution(InsuranceTitles titles, BenefitParameters parameters) {
            this.titles = titles;
            this.parameters = parameters;
            this.employmentAtMinimumWage = titles.employment() != null && titles.employment().atLeastMinimumWage();
        }

        ResolvedInsurance resolve() {
            if (!titles.hasAnyZusTitle()) {
                if (titles.agriculturalInsurance()) {
                    checks.add(Check.no("Rolnik w KRUS: zasiłki wypłaca KRUS, nie ZUS — kwota poniżej jest orientacyjna."));
                }
                return new ResolvedInsurance(null, Money.ZERO, parts, checks, titles.agriculturalInsurance(),
                        Money.ZERO);
            }
            if (titles.employment() != null) {
                employment(titles.employment());
            }
            if (titles.mandateContract() != null && titles.selfEmployment() != null && !employmentAtMinimumWage) {
                mandateContractAndFirm();
            } else {
                if (titles.mandateContract() != null) {
                    voluntary(InsuranceTitle.MANDATE_CONTRACT);
                }
                if (titles.selfEmployment() != null) {
                    voluntary(InsuranceTitle.SELF_EMPLOYMENT);
                }
            }
            if (titles.agriculturalInsurance()) {
                checks.add(Check.info(titles.employment() != null
                        ? "Etat + gospodarstwo: z etatu podlegasz ZUS — zasiłek z ZUS liczymy z etatu."
                        : "KRUS + firma: jeśli zostajesz w KRUS (warunki ustawy o ubezpieczeniu rolników), zasiłek wypłaca KRUS. Kalkulator liczy wariant z ubezpieczeniem w ZUS."));
            }
            boolean blockedFirm = blockedFirmCheck != null;
            if (blockedFirm && parts.isEmpty()) {
                // the benefit calculation itself explains the blocked benefit, so it is not
                // repeated here
                checks.remove(blockedFirmCheck);
            }
            Money base = parts.stream().map(TitleBase::base).reduce(Money.ZERO, Money::plus);
            if (parts.size() > 1) {
                checks.add(Check.ok("Zasiłek z %d tytułów — każdy liczony osobno: %s.".formatted(parts.size(),
                        parts.stream().map(part -> part.title().label() + " " + money(part.base()))
                                .collect(Collectors.joining(" + ")))));
            }
            if (parts.isEmpty() && !blockedFirm) {
                checks.add(Check.no("Żaden z tytułów nie daje ubezpieczenia chorobowego — zasiłek z ZUS nie przysługuje."));
            }
            if (!parts.isEmpty() && base.isZero()) {
                checks.add(Check.no("Wpisz podstawę zasiłku — bez niej nie policzymy kwoty."));
            }
            Money blockingDebt = blockedFirm && parts.isEmpty() ? titles.selfEmployment().debt() : Money.ZERO;
            return new ResolvedInsurance(mainTitle(blockedFirm), base, parts, checks, titles.agriculturalInsurance(),
                    blockingDebt);
        }

        private void employment(InsuranceTitles.Employment employment) {
            Money base = employment.base();
            if (employmentAtMinimumWage && !base.isZero() && base.isLessThan(parameters.minimumBenefitBase())) {
                base = parameters.minimumBenefitBase();
                checks.add(Check.info("Etat: podstawa podniesiona do minimum %s (płaca minimalna − 13,71%%)."
                        .formatted(money(parameters.minimumBenefitBase()))));
            }
            parts.add(new TitleBase(InsuranceTitle.EMPLOYMENT, base));
        }

        /**
         * Mandatory insurance comes from one title only; voluntary sickness insurance
         * only from that one.
         */
        private void mandateContractAndFirm() {
            // pay before contributions >= minimum wage, i.e. base >= minimum wage minus
            // contributions
            Money minimumWageBase = parameters.minimumWage().times(parameters.employeeContributionRate().complement());
            boolean mandateAtMinimumWage = !titles.mandateContract().base().isLessThan(minimumWageBase);
            InsuranceTitle main = mandateAtMinimumWage ? InsuranceTitle.MANDATE_CONTRACT : InsuranceTitle.SELF_EMPLOYMENT;
            InsuranceTitle other = mandateAtMinimumWage ? InsuranceTitle.SELF_EMPLOYMENT : InsuranceTitle.MANDATE_CONTRACT;
            voluntary(main);
            checks.add(Check.info(
                    "Zlecenie + firma: obowiązkowo ubezpieczasz się z tytułu „%s”%s, więc dobrowolne chorobowe — tylko z niego. Z tytułu „%s” zasiłku nie ma."
                            .formatted(main.label(),
                                    mandateAtMinimumWage ? " (zlecenie co najmniej z płacą minimalną)" : "",
                                    other.label())));
        }

        private void voluntary(InsuranceTitle title) {
            String label = title.label();
            if (employmentAtMinimumWage) {
                checks.add(Check.info(
                        "Etat z co najmniej płacą minimalną + %s: z tytułu „%s” nie ma ubezpieczenia chorobowego — zasiłek tylko z etatu."
                                .formatted(label, label)));
                return;
            }
            boolean sickness;
            Money base;
            if (title == InsuranceTitle.MANDATE_CONTRACT) {
                InsuranceTitles.MandateContract mandate = titles.mandateContract();
                if (mandate.student()) {
                    checks.add(Check.info(
                            "Student lub uczeń do 26 lat na zleceniu nie podlega ubezpieczeniom — z tego tytułu zasiłku nie ma."));
                    return;
                }
                sickness = mandate.voluntarySickness();
                base = mandate.base();
            } else {
                InsuranceTitles.SelfEmployment firm = titles.selfEmployment();
                if (firm.startupRelief()) {
                    checks.add(Check.info(
                            "Ulga na start: przez 6 miesięcy firma nie podlega ubezpieczeniom społecznym — z tego tytułu zasiłku nie ma."));
                    return;
                }
                sickness = firm.voluntarySickness();
                base = firm.base();
            }
            if (!sickness) {
                checks.add(Check.info("%s: bez dobrowolnego chorobowego — z tego tytułu zasiłek nie przysługuje."
                        .formatted(capitalized(label))));
                return;
            }
            if (base.isGreaterThan(parameters.maximumVoluntaryBenefitBase())) {
                base = parameters.maximumVoluntaryBenefitBase();
                checks.add(Check.info("%s: zastosowano limit podstawy dobrowolnego chorobowego %s."
                        .formatted(label, money(parameters.maximumVoluntaryBenefitBase()))));
            }
            if (title == InsuranceTitle.SELF_EMPLOYMENT
                    && titles.selfEmployment().debt().isGreaterThan(parameters.debtThreshold())) {
                blockedFirmCheck = Check.no(
                        "Firma: zaległość %s > %s — zasiłek z firmy wstrzymany do spłaty; brak spłaty w 6 mies. = utrata prawa."
                                .formatted(money(titles.selfEmployment().debt()), money(parameters.debtThreshold())));
                checks.add(blockedFirmCheck);
                return;
            }
            parts.add(new TitleBase(title, base));
        }

        private InsuranceTitle mainTitle(boolean blockedFirm) {
            if (parts.stream().anyMatch(part -> part.title() == InsuranceTitle.EMPLOYMENT)) {
                return InsuranceTitle.EMPLOYMENT;
            }
            if (parts.stream().anyMatch(part -> part.title() == InsuranceTitle.SELF_EMPLOYMENT)) {
                return InsuranceTitle.SELF_EMPLOYMENT;
            }
            if (!parts.isEmpty()) {
                return InsuranceTitle.MANDATE_CONTRACT;
            }
            return blockedFirm ? InsuranceTitle.SELF_EMPLOYMENT : null;
        }

        private static String capitalized(String label) {
            return Character.toUpperCase(label.charAt(0)) + label.substring(1);
        }
    }
}
