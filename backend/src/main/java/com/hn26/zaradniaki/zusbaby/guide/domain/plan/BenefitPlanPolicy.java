package com.hn26.zaradniaki.zusbaby.guide.domain.plan;

import com.hn26.zaradniaki.zusbaby.guide.domain.GuideParameters;
import com.hn26.zaradniaki.zusbaby.guide.domain.LeaveWeeks;
import com.hn26.zaradniaki.zusbaby.guide.domain.survey.CareStage;
import com.hn26.zaradniaki.zusbaby.guide.domain.survey.PartnerTracking;
import com.hn26.zaradniaki.zusbaby.guide.domain.survey.Survey;
import com.hn26.zaradniaki.zusbaby.shared.domain.Weeks;
import java.util.ArrayList;
import java.util.List;

/**
 * Benefit plan "Co Ci przysługuje", same rows and texts as {@code planHtml()}
 * of the frontend prototype: without sickness insurance only a notice;
 * otherwise sick leave in pregnancy, the leaves one after another (maternity,
 * supplementary, parental), the father's leave and the care allowance.
 */
public final class BenefitPlanPolicy {

    public List<PlanItem> plan(Survey survey, LeaveWeeks weeks, GuideParameters parameters) {
        if (!survey.hasSicknessInsurance()) {
            return List.of(PlanItem.notice("Bez ubezpieczenia chorobowego nie ma zasiłków z ZUS",
                    "Zobacz, jak się zgłosić →", "zleceniobiorcy"));
        }
        boolean pregnancy = survey.stage() == CareStage.PREGNANCY;
        boolean adoption = survey.stage() == CareStage.ADOPTION;
        List<PlanItem> items = new ArrayList<>();
        if (pregnancy && survey.isMother()) {
            items.add(PlanItem.benefit("heart", "Teraz, w ciąży", "Zwolnienie z kodem B — 100% podstawy", "l4-ciaza"));
        }
        if (survey.isMother() || adoption || survey.isFather()) {
            items.add(leaves(survey, weeks, parameters, pregnancy, adoption));
        }
        if (survey.partner() != PartnerTracking.SINGLE_PARENT && !adoption) {
            items.add(PlanItem.benefit("users", survey.isFather() ? "Dla Ciebie" : "Dla taty",
                    "Ojcowski 2 tyg. (100%) + 9 tyg. rodzicielskiego tylko dla niego", "ojcowski"));
        }
        if (!pregnancy) {
            items.add(PlanItem.benefit("hospital", "Gdy dziecko zachoruje", "Zasiłek opiekuńczy 80%, do 60 dni w roku",
                    "opiekunczy"));
        }
        return items;
    }

    private static PlanItem leaves(Survey survey, LeaveWeeks weeks, GuideParameters parameters, boolean pregnancy,
            boolean adoption) {
        List<PlannedLeave> leaves = new ArrayList<>();
        leaves.add(new PlannedLeave(LeaveKind.MATERNITY, adoption ? "Na warunkach macierzyńskiego" : "Macierzyński",
                weeks.maternity(), parameters.maternityRate()));
        if (!weeks.supplementary().isZero()) {
            leaves.add(new PlannedLeave(LeaveKind.SUPPLEMENTARY, "Uzupełniający", weeks.supplementary(),
                    parameters.supplementaryRate()));
        }
        leaves.add(new PlannedLeave(LeaveKind.PARENTAL, "Rodzicielski", weeks.parental(), parameters.parentalRate()));
        Weeks total = leaves.stream().map(PlannedLeave::weeks).reduce(Weeks.ZERO, Weeks::plus);
        String when = pregnancy ? "Po porodzie" : adoption ? "Po przyjęciu dziecka" : "Zasiłek macierzyński";
        String text = "Urlopy idą <b>po kolei</b>: najpierw %s, potem rodzicielski. Możesz też wybrać <b>81,5%% przez cały czas</b> — wniosek do 21 dni %s."
                .formatted(adoption ? "urlop na warunkach macierzyńskiego" : "macierzyński",
                        adoption ? "od przyjęcia" : "po porodzie");
        return new PlanItem(PlanItemKind.LEAVES, null,
                "%s: %s tygodni zasiłku".formatted(when, total.value().toPlainString()), text, "wysokosc-mac", total,
                leaves);
    }
}
