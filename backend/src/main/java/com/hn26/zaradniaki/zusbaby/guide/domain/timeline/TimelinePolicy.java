package com.hn26.zaradniaki.zusbaby.guide.domain.timeline;

import com.hn26.zaradniaki.zusbaby.calendar.api.model.DeadlineType;
import com.hn26.zaradniaki.zusbaby.guide.domain.GuideParameters;
import com.hn26.zaradniaki.zusbaby.guide.domain.survey.PartnerTracking;
import com.hn26.zaradniaki.zusbaby.guide.domain.survey.Survey;
import com.hn26.zaradniaki.zusbaby.guide.domain.survey.WorkForm;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Deadlines and milestones of the family, same items, texts and order as
 * {@code buildTimeline()} of the frontend prototype (without the
 * contribution-debt items, which come from the parent's profile, not the
 * survey):
 * <ul>
 * <li>pregnancy: maternity leave before birth, the 81.5% decision, or the
 * missing sickness insurance,</li>
 * <li>born child: the 81.5% application (21 days), the 6-month limitation,
 * supplementary leave for a premature baby, end of maternity leave, the
 * father's paternity leave and his 9 weeks, re-registering for voluntary
 * sickness insurance after the benefit,</li>
 * <li>child taken in: the leave application (7 days) and its latest start (21
 * days),</li>
 * <li>later milestones: last day of parental leave, age limits of the care
 * allowance.</li>
 * </ul>
 * Items are sorted by date; a status says whether an item is late, due within
 * 30 days, past or ahead.
 */
public final class TimelinePolicy {

    private static final int DUE_SOON_DAYS = 30;
    private static final String MATERNITY_BENEFIT_CALCULATOR = "zasilek";

    public List<TimelineItem> timeline(Survey survey, GuideParameters parameters, DeadlineCalendar calendar,
            LocalDate today) {
        Plan plan = new Plan(survey, parameters, calendar, today);
        switch (survey.stage()) {
            case PREGNANCY -> plan.pregnancy();
            case CHILD -> plan.child();
            case ADOPTION -> plan.adoption();
        }
        return plan.items.stream().sorted(Comparator.comparing(Item::date)).map(item -> item.finish(today)).toList();
    }

    /** Items of one survey, before sorting. */
    private static final class Plan {

        private final Survey survey;
        private final DeadlineCalendar calendar;
        private final LocalDate today;
        private final long maternityWeeks;
        private final boolean insured;
        private final Institution payer;
        private final List<Item> items = new ArrayList<>();

        Plan(Survey survey, GuideParameters parameters, DeadlineCalendar calendar, LocalDate today) {
            this.survey = survey;
            this.calendar = calendar;
            this.today = today;
            this.maternityWeeks = parameters.maternityWeeks(survey.children()).value().longValueExact();
            this.insured = survey.hasSicknessInsurance();
            this.payer = survey.works(WorkForm.SELF_EMPLOYMENT) && !survey.works(WorkForm.EMPLOYMENT)
                    ? Institution.ZUS
                    : Institution.EMPLOYER;
        }

        void pregnancy() {
            LocalDate due = survey.date();
            if (survey.isMother() && insured) {
                LocalDate start = due.minusWeeks(6);
                add(new Item("mac-przed", "Opcjonalnie: urlop macierzyński przed porodem",
                        survey.works(WorkForm.EMPLOYMENT) ? Institution.EMPLOYER : Institution.ZUS, start)
                        .description("Maks. 6 tygodni przed terminem. Wniosek + zaświadczenie o terminie porodu.")
                        .deadline(calendar.daysBefore(start, 14)).article("mac-przed-porodem").optional());
                add(new Item("w81-plan", "Decyzja: 81,5% czy 100% + 70%", payer, due.plusDays(21))
                        .description("Liczone od faktycznej daty porodu: 21 dni.")
                        .deadline(calendar.daysAfter(due, 21)).calculator(MATERNITY_BENEFIT_CALCULATOR)
                        .article("wysokosc-mac").estimate());
            }
            if (!insured) {
                add(new Item("chor-brak", "Nie masz ubezpieczenia chorobowego", Institution.INFO, today).description(
                        "Zasiłek macierzyński z ZUS wymaga ubezpieczenia chorobowego w dniu porodu. Przedsiębiorca lub zleceniobiorca może zgłosić się do niego dobrowolnie (ZUS ZUA) — nie wstecz.")
                        .article("zleceniobiorcy"));
            }
        }

        void child() {
            LocalDate birth = survey.date();
            if (survey.isMother() && insured) {
                add(new Item("w81", "Wniosek o 81,5% (pełny wymiar urlopu)", payer, birth.plusDays(21))
                        .description("Bez wniosku: 100% za macierzyński i 70% za rodzicielski.")
                        .lateNote(
                                "Termin minął — zasiłek będzie wypłacany w wariancie 100% + 70%. To nie jest strata, tylko inny rozkład kwot.")
                        .deadline(calendar.daysAfter(birth, 21)).wizard("w-81")
                        .calculator(MATERNITY_BENEFIT_CALCULATOR).article("wysokosc-mac"));
            }
            if (insured) {
                add(new Item("przedawn", "Wniosek o zasiłek — najpóźniej 6 miesięcy", Institution.INFO,
                        birth.plusMonths(6)).description(
                                "Roszczenie o zasiłek przedawnia się po 6 miesiącach od ostatniego dnia okresu, za który przysługuje.")
                        .article("przedawnienie").milestone());
            }
            if (survey.preterm() != null) {
                LocalDate maternityEnd = birth.plusWeeks(maternityWeeks).minusDays(1);
                add(new Item("uzup", "Wniosek o uzupełniający urlop macierzyński", Institution.EMPLOYER,
                        maternityEnd.minusDays(21))
                        .description("Najpóźniej 21 dni przed końcem macierzyńskiego, z zaświadczeniem ze szpitala.")
                        .deadline(calendar.daysBefore(maternityEnd, 21)).wizard("w-uzupelniajacy")
                        .calculator(MATERNITY_BENEFIT_CALCULATOR).article("uzupelniajacy"));
            }
            if (survey.isMother() && insured) {
                add(new Item("mac-end", "Koniec urlopu macierzyńskiego", Institution.INFO,
                        birth.plusWeeks(maternityWeeks)).milestone());
                add(new Item("rodz-1y", "Min. 1 dzień rodzicielskiego przed 1. urodzinami", Institution.EMPLOYER,
                        birth.plusMonths(12).minusDays(1))
                        .description("Warunek zachowania 81,5% (art. 31 ust. 3g)."));
            }
            if (survey.isMother() && survey.works(WorkForm.SELF_EMPLOYMENT)) {
                add(new Item("zua", "Po zasiłku: ponownie zgłoś się do chorobowego (ZUS ZUA)", Institution.ZUS,
                        birth.plusWeeks(maternityWeeks + 32)).description(
                                "Przy zasiłku macierzyńskim zostajesz automatycznie wyrejestrowana z dobrowolnego chorobowego."));
            }
            boolean father = survey.isFather();
            if (father || survey.partner() == PartnerTracking.SHOW_PARTNER) {
                LocalDate lastStart = birth.plusMonths(12).minusDays(14);
                add(new Item("ojcowski",
                        father
                                ? "Twój urlop ojcowski — do 1. urodzin dziecka"
                                : "Urlop ojcowski taty — do 1. urodzin dziecka",
                        Institution.EMPLOYER, lastStart).description("2 tygodnie, 100%. Wniosek 7 dni przed.")
                        .deadline(calendar.daysBefore(lastStart, 7)).wizard(father ? "w-ojcowski" : null)
                        .article("ojcowski"));
                add(new Item("tata9",
                        father ? "Twoje 9 tygodni rodzicielskiego (70%)" : "9 tygodni rodzicielskiego dla taty (70%)",
                        Institution.EMPLOYER, birth.plusWeeks(maternityWeeks + 4)).description(
                                "Nieprzenoszalne — przepadną, jeśli nie zostaną wykorzystane. Do końca roku, w którym dziecko kończy 6 lat.")
                        .wizard(father ? "w-rodzicielski" : null).article("rodzicielski"));
            }
            older(birth);
        }

        void adoption() {
            LocalDate takenIn = survey.date();
            add(new Item("adop", "Wniosek o urlop na warunkach urlopu macierzyńskiego", Institution.EMPLOYER,
                    takenIn.plusDays(7)).description("W ciągu 7 dni od przyjęcia dziecka.")
                    .deadline(calendar.daysAfter(takenIn, 7)).wizard("w-adopcja"));
            add(new Item("adop-start", "Najpóźniejszy początek urlopu (21 dni od przyjęcia)", Institution.EMPLOYER,
                    takenIn.plusDays(21)).milestone());
            if (insured) {
                add(new Item("w81a", "Opcjonalnie: wariant 81,5% (21 dni od przyjęcia)", Institution.EMPLOYER,
                        takenIn.plusDays(21)).deadline(calendar.daysAfter(takenIn, 21))
                        .calculator(MATERNITY_BENEFIT_CALCULATOR).article("wysokosc-mac"));
            }
            older(survey.childBirthDate());
        }

        /** Milestones after the maternity benefit (only benefits of the ZUS guide). */
        private void older(LocalDate birth) {
            if (survey.works(WorkForm.EMPLOYMENT)) {
                // unused parental leave is lost at the end of the year the child turns 6
                LocalDate end = LocalDate.of(birth.getYear() + 6, 12, 31);
                TimelineDeadline before = calendar.daysBefore(end, 21);
                add(new Item("urlopy-6", "Ostatni dzień na urlop rodzicielski", Institution.EMPLOYER, end)
                        .description(
                                "Niewykorzystana część przepada z końcem roku, w którym dziecko kończy 6 lat.")
                        .article("rodzicielski")
                        .deadline(new TimelineDeadline(DeadlineType.AFTER, end, end, false, null, before.safe())));
            }
            if (insured) {
                add(new Item("wiek-8", "8. urodziny: koniec zasiłku opiekuńczego na zdrowe dziecko", Institution.INFO,
                        birth.plusMonths(96))
                        .description("Np. przy nagłym zamknięciu żłobka, przedszkola lub szkoły.").milestone()
                        .article("opiekunczy"));
                add(new Item("wiek-14", "14. urodziny: koniec zasiłku opiekuńczego na chore dziecko (60 dni w roku)",
                        Institution.INFO, birth.plusMonths(168)).milestone().article("opiekunczy"));
            }
        }

        private void add(Item item) {
            items.add(item);
        }
    }

    /** A timeline item being planned. */
    private static final class Item {

        private final String key;
        private final String title;
        private final Institution institution;
        private final LocalDate date;
        private String description;
        private String lateNote;
        private TimelineDeadline deadline;
        private String articleId;
        private String wizardId;
        private String calculator;
        private boolean optional;
        private boolean estimate;
        private boolean milestone;

        Item(String key, String title, Institution institution, LocalDate date) {
            this.key = key;
            this.title = title;
            this.institution = institution;
            this.date = date;
        }

        LocalDate date() {
            return date;
        }

        Item description(String text) {
            this.description = text;
            return this;
        }

        Item lateNote(String text) {
            this.lateNote = text;
            return this;
        }

        Item deadline(TimelineDeadline value) {
            this.deadline = value;
            return this;
        }

        Item article(String id) {
            this.articleId = id;
            return this;
        }

        Item wizard(String id) {
            this.wizardId = id;
            return this;
        }

        Item calculator(String id) {
            this.calculator = id;
            return this;
        }

        Item optional() {
            this.optional = true;
            return this;
        }

        Item estimate() {
            this.estimate = true;
            return this;
        }

        Item milestone() {
            this.milestone = true;
            return this;
        }

        TimelineItem finish(LocalDate today) {
            LocalDate due = deadline != null ? deadline.due() : date;
            long daysLeft = ChronoUnit.DAYS.between(today, due);
            TimelineStatus status;
            if (deadline != null && daysLeft < 0 && !estimate) {
                status = TimelineStatus.LATE;
            } else if (daysLeft >= 0 && daysLeft <= DUE_SOON_DAYS) {
                status = TimelineStatus.NOW;
            } else if (daysLeft < 0) {
                status = TimelineStatus.PAST;
            } else {
                status = TimelineStatus.FUTURE;
            }
            return new TimelineItem(key, title, description, lateNote, institution, date, deadline, articleId,
                    wizardId, calculator, optional, estimate, milestone, due, daysLeft, status);
        }
    }
}
