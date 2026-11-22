package com.hn26.zaradniaki.zusbaby.legalrules.api.model;

import static com.hn26.zaradniaki.zusbaby.legalrules.api.model.ParameterKind.AMOUNT;
import static com.hn26.zaradniaki.zusbaby.legalrules.api.model.ParameterKind.DAYS;
import static com.hn26.zaradniaki.zusbaby.legalrules.api.model.ParameterKind.MONTHS;
import static com.hn26.zaradniaki.zusbaby.legalrules.api.model.ParameterKind.RATE;
import static com.hn26.zaradniaki.zusbaby.legalrules.api.model.ParameterKind.WEEKS;
import static com.hn26.zaradniaki.zusbaby.legalrules.api.model.ParameterKind.WEEKS_BY_CHILDREN;
import static com.hn26.zaradniaki.zusbaby.legalrules.api.model.ParameterKind.YEARS;

/**
 * Every legal parameter the calculations use, with its kind and the Polish
 * label shown in the admin panel.
 */
public enum ParameterKey {

    // Amounts (PLN)
    MINIMUM_WAGE(AMOUNT, "Płaca minimalna"),
    MINIMUM_BENEFIT_BASE(AMOUNT, "Minimalna podstawa zasiłku (pełny etat)"),
    MAXIMUM_VOLUNTARY_BENEFIT_BASE(AMOUNT, "Maks. podstawa — dobrowolne chorobowe"),
    STANDARD_SELF_EMPLOYED_BASE(AMOUNT, "Standardowa podstawa składek JDG"),
    MINIMUM_MATERNITY_BENEFIT(AMOUNT, "Minimum zasiłku macierzyńskiego na rękę"),
    FUNERAL_GRANT(AMOUNT, "Zasiłek pogrzebowy"),
    DEBT_THRESHOLD(AMOUNT, "Próg zaległości blokującej zasiłek"),

    // Rates (fractions)
    EMPLOYEE_CONTRIBUTION_RATE(RATE, "Składki pracownika (odliczane od podstawy)"),
    DEBT_THRESHOLD_RATE(RATE, "Próg zaległości jako ułamek płacy minimalnej"),
    MATERNITY_LEAVE_RATE(RATE, "Urlop macierzyński"),
    PARENTAL_LEAVE_RATE(RATE, "Urlop rodzicielski"),
    AVERAGED_RATE(RATE, "Wariant uśredniony (wniosek do 21 dni)"),
    SUPPLEMENTARY_LEAVE_RATE(RATE, "Uzupełniający urlop macierzyński"),
    PATERNITY_LEAVE_RATE(RATE, "Urlop ojcowski"),
    PREGNANCY_SICKNESS_RATE(RATE, "Zasiłek chorobowy w ciąży"),
    CARE_BENEFIT_RATE(RATE, "Zasiłek opiekuńczy"),
    PREGNANCY_REHABILITATION_RATE(RATE, "Świadczenie rehabilitacyjne w ciąży"),
    INCOME_TAX_ADVANCE_RATE(RATE, "Zaliczka PIT (symulacja)"),

    // Leave dimensions (weeks)
    MATERNITY_LEAVE_WEEKS(WEEKS_BY_CHILDREN, "Urlop macierzyński wg liczby dzieci"),
    PARENTAL_ALLOWANCE_WEEKS(WEEKS_BY_CHILDREN, "Świadczenie rodzicielskie wg liczby dzieci"),
    PARENTAL_LEAVE_WEEKS_ONE_CHILD(WEEKS, "Rodzicielski — 1 dziecko"),
    PARENTAL_LEAVE_WEEKS_MULTIPLE_CHILDREN(WEEKS, "Rodzicielski — więcej dzieci"),
    PARENTAL_LEAVE_WEEKS_ZA_ZYCIEM_ONE_CHILD(WEEKS, "Rodzicielski „Za życiem” — 1 dziecko"),
    PARENTAL_LEAVE_WEEKS_ZA_ZYCIEM_MULTIPLE_CHILDREN(WEEKS, "Rodzicielski „Za życiem” — więcej dzieci"),
    PARENTAL_LEAVE_WITH_WORK_MAX_WEEKS_ONE_CHILD(WEEKS, "Maks. rodzicielski z pracą — 1 dziecko"),
    PARENTAL_LEAVE_WITH_WORK_MAX_WEEKS_MULTIPLE_CHILDREN(WEEKS,
            "Maks. rodzicielski z pracą — więcej dzieci"),
    PARENTAL_LEAVE_WITH_WORK_MAX_WEEKS_ZA_ZYCIEM_ONE_CHILD(WEEKS,
            "Maks. rodzicielski z pracą „Za życiem” — 1 dziecko"),
    PARENTAL_LEAVE_WITH_WORK_MAX_WEEKS_ZA_ZYCIEM_MULTIPLE_CHILDREN(WEEKS,
            "Maks. rodzicielski z pracą „Za życiem” — więcej dzieci"),
    NON_TRANSFERABLE_PARENTAL_WEEKS(WEEKS, "Nieprzenoszalna część rodzicielskiego"),
    PATERNITY_LEAVE_WEEKS(WEEKS, "Urlop ojcowski"),
    MOTHER_ONLY_MATERNITY_WEEKS(WEEKS, "Macierzyński wyłącznie dla matki"),
    MAX_MATERNITY_WEEKS_BEFORE_BIRTH(WEEKS, "Maks. macierzyński przed porodem"),
    ADOPTION_MINIMUM_WEEKS(WEEKS, "Min. urlop na warunkach macierzyńskiego"),
    ADOPTION_PARENTAL_MINIMUM_WEEKS(WEEKS, "Rodzicielski przy minimalnym wymiarze adopcji"),
    ADOPTION_PARENTAL_MINIMUM_WEEKS_ZA_ZYCIEM(WEEKS,
            "Rodzicielski przy minimalnym wymiarze adopcji „Za życiem”"),
    SUPPLEMENTARY_LEAVE_MAX_WEEKS_EXTREME_PRETERM(WEEKS,
            "Uzupełniający — przed 28. tc lub do 1000 g"),
    SUPPLEMENTARY_LEAVE_MAX_WEEKS(WEEKS, "Uzupełniający — pozostałe przypadki"),

    // Age limits (years)
    FOSTER_CHILD_AGE_LIMIT(YEARS, "Limit wieku — rodzina zastępcza"),
    FOSTER_CHILD_AGE_LIMIT_DEFERRED_SCHOOL(YEARS,
            "Limit wieku — rodzina zastępcza, odroczony obowiązek szkolny"),
    ADOPTED_CHILD_AGE_LIMIT(YEARS, "Limit wieku — przysposobienie"),

    // Periods (days / months)
    PREGNANCY_BENEFIT_PERIOD_DAYS(DAYS, "Okres zasiłkowy w ciąży (dni)"),
    SICK_PAY_DAYS(DAYS, "Wynagrodzenie chorobowe (dni)"),
    SICK_PAY_DAYS_AGE_50(DAYS, "Wynagrodzenie chorobowe po 50. r.ż. (dni)"),
    WAITING_PERIOD_MANDATORY_DAYS(DAYS, "Wyczekiwanie — obowiązkowe (dni)"),
    WAITING_PERIOD_VOLUNTARY_DAYS(DAYS, "Wyczekiwanie — dobrowolne (dni)"),
    CARE_BENEFIT_DAYS_PER_YEAR(DAYS, "Zasiłek opiekuńczy — dni w roku"),
    REHABILITATION_MAX_MONTHS(MONTHS, "Świadczenie rehabilitacyjne — maks. miesięcy");

    private final ParameterKind kind;
    private final String label;

    ParameterKey(ParameterKind kind, String label) {
        this.kind = kind;
        this.label = label;
    }

    public ParameterKind kind() {
        return kind;
    }

    public String label() {
        return label;
    }
}
