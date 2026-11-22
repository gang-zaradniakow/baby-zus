package com.hn26.zaradniaki.zusbaby.guide.domain.alert;

import com.hn26.zaradniaki.zusbaby.guide.domain.survey.Survey;
import com.hn26.zaradniaki.zusbaby.guide.domain.survey.WorkForm;
import java.util.ArrayList;
import java.util.List;

/**
 * Alerts of the guide, same texts and order as {@code alerts()} of the frontend
 * prototype for the survey answers (the contribution-debt and sick-leave alerts
 * come from the parent's profile, not the survey).
 */
public final class AlertPolicy {

    public List<Alert> alerts(Survey survey) {
        List<Alert> alerts = new ArrayList<>();
        boolean farmer = survey.works(WorkForm.FARMER);
        if (!survey.hasSicknessInsurance() && !farmer) {
            alerts.add(new Alert(AlertLevel.INFO, "info", "Nie masz ubezpieczenia chorobowego",
                    "Zasiłki z ZUS wymagają ubezpieczenia chorobowego. Bez niego przysługuje świadczenie rodzicielskie z gminy (Poradnik, s. 35).",
                    "#/wiedza/a/wazne-mac"));
        }
        if (survey.works(WorkForm.STARTUP_RELIEF)) {
            alerts.add(new Alert(AlertLevel.WARNING, "alert", "Ulga na start = brak ubezpieczenia chorobowego",
                    "Przez 6 miesięcy ulgi nie podlegasz ubezpieczeniom społecznym, więc nie masz prawa do zasiłków. Możesz zrezygnować z ulgi wcześniej.",
                    "#/wiedza/a/jdg"));
        }
        if (farmer) {
            alerts.add(new Alert(AlertLevel.INFO, "info", "Jesteś w KRUS",
                    "Zasiłek macierzyński dla rolników wypłaca KRUS, nie ZUS.", "#/wiedza"));
        }
        return alerts;
    }
}
