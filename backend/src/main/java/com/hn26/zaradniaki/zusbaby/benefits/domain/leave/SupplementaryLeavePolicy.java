package com.hn26.zaradniaki.zusbaby.benefits.domain.leave;

import com.hn26.zaradniaki.zusbaby.benefits.api.model.PretermBirth;
import com.hn26.zaradniaki.zusbaby.benefits.domain.LeaveParameters;
import com.hn26.zaradniaki.zusbaby.shared.domain.Weeks;

/**
 * Supplementary maternity leave (art. 180² KP, since 19.03.2025), same rules
 * and messages as {@code uzupelniajacy()} of the frontend prototype: a week of
 * leave for every started week in hospital, up to 15 weeks (before the 28th
 * week or up to 1000 g) or 8 weeks; after the 37th week only for a stay of at
 * least 2 days starting between the 5th and the 28th day.
 */
public final class SupplementaryLeavePolicy {

    private static final int EXTREME_PRETERM_WEEK = 28;
    private static final int EXTREME_PRETERM_WEIGHT_GRAMS = 1000;
    private static final int FULL_TERM_WEEK = 37;
    private static final int MIN_FULL_TERM_HOSPITAL_DAYS = 2;
    private static final int FIRST_COUNTED_DAY = 5;
    private static final int LAST_START_DAY = 28;

    public SupplementaryLeave leave(PretermBirth birth, LeaveParameters parameters) {
        Weeks limit;
        String rule;
        if (birth.gestationWeek() < EXTREME_PRETERM_WEEK || birth.birthWeightGrams() <= EXTREME_PRETERM_WEIGHT_GRAMS) {
            limit = parameters.supplementaryMaxWeeksExtremePreterm();
            rule = "Urodzenie przed 28. tygodniem ciąży lub masa ≤ 1000 g: tydzień urlopu za każdy tydzień pobytu w szpitalu do 15. tygodnia po porodzie.";
        } else if (birth.gestationWeek() < FULL_TERM_WEEK) {
            limit = parameters.supplementaryMaxWeeks();
            rule = "Urodzenie między 28. a 37. tygodniem ciąży i masa > 1000 g: tydzień za tydzień pobytu do 8. tygodnia po porodzie.";
        } else if (birth.hospitalDays() >= MIN_FULL_TERM_HOSPITAL_DAYS && birth.hospitalStartDay() >= FIRST_COUNTED_DAY
                && birth.hospitalStartDay() <= LAST_START_DAY) {
            limit = parameters.supplementaryMaxWeeks();
            rule = "Urodzenie po 37. tygodniu ciąży: pobyt min. 2 kolejne dni, rozpoczęty między 5. a 28. dniem po porodzie — liczy się pobyt od 5. dnia do 8. tygodnia.";
        } else {
            return new SupplementaryLeave(Weeks.ZERO, Weeks.ZERO,
                    "Po 37. tygodniu urlop przysługuje, gdy pobyt w szpitalu trwa min. 2 kolejne dni i zaczyna się między 5. a 28. dniem po porodzie.");
        }
        Weeks startedWeeksInHospital = Weeks.of((Math.max(0, birth.hospitalDays()) + 6) / 7);
        return new SupplementaryLeave(startedWeeksInHospital.min(limit), limit, rule);
    }
}
