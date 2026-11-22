package com.hn26.zaradniaki.zusbaby.guide.domain.stage;

import com.hn26.zaradniaki.zusbaby.guide.domain.survey.CareStage;
import com.hn26.zaradniaki.zusbaby.guide.domain.survey.Survey;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

/**
 * Week of pregnancy and age of the child, same as {@code pregnancyWeek()},
 * {@code ageMonths()} and {@code ageLabel()} of the frontend prototype.
 */
public final class StagePolicy {

    private static final int FULL_TERM_WEEKS = 40;
    private static final int LAST_WEEK = 42;
    private static final int DAYS_SHOWN_IN_WEEKS = 60;
    private static final int MONTHS_SHOWN_IN_MONTHS = 24;
    private static final int YEARS_WITH_LATA = 5;

    public StageSummary summary(Survey survey, LocalDate today) {
        Integer week = survey.stage() == CareStage.PREGNANCY ? pregnancyWeek(survey.date(), today) : null;
        LocalDate birth = survey.birthDate();
        return birth == null
                ? new StageSummary(survey.stage(), week, null, null)
                : new StageSummary(survey.stage(), week, ageMonths(birth, today), ageLabel(birth, today));
    }

    private static int pregnancyWeek(LocalDate due, LocalDate today) {
        long daysToDue = ChronoUnit.DAYS.between(today, due);
        return (int) Math.clamp(FULL_TERM_WEEKS - Math.ceilDiv(daysToDue, 7), 1, LAST_WEEK);
    }

    private static int ageMonths(LocalDate birth, LocalDate today) {
        int months = (today.getYear() - birth.getYear()) * 12 + today.getMonthValue() - birth.getMonthValue();
        if (today.getDayOfMonth() < birth.getDayOfMonth()) {
            months--;
        }
        return Math.max(0, months);
    }

    private static String ageLabel(LocalDate birth, LocalDate today) {
        long days = ChronoUnit.DAYS.between(birth, today);
        if (days < 0) {
            return "jeszcze nie urodzone";
        }
        if (days < DAYS_SHOWN_IN_WEEKS) {
            return "%d tyg. %d dni".formatted(days / 7, days % 7);
        }
        int months = ageMonths(birth, today);
        if (months < MONTHS_SHOWN_IN_MONTHS) {
            return months + " mies.";
        }
        int years = months / 12;
        String label = "%d %s".formatted(years, years < YEARS_WITH_LATA ? "lata" : "lat");
        return months % 12 == 0 ? label : label + " " + months % 12 + " mies.";
    }
}
