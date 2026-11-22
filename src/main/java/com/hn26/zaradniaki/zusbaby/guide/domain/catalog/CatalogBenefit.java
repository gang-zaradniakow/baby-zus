package com.hn26.zaradniaki.zusbaby.guide.domain.catalog;

import com.hn26.zaradniaki.zusbaby.guide.domain.timeline.Institution;

/**
 * Benefits of the ZUS guide for parents, as the {@code BENEFITS} catalog of the
 * frontend prototype (without the two shown only in the support mode).
 */
public enum CatalogBenefit {

    L4_CIAZA("l4-ciaza", "Zasiłek chorobowy w ciąży (L4 z kodem B)", "L4 w ciąży — 100%", Institution.ZUS, "l4-ciaza", null, null),
    MAC_PRZED("mac-przed", "Urlop macierzyński przed porodem", "Do 6 tygodni przed terminem", Institution.EMPLOYER, "mac-przed-porodem", null, null),
    REHAB("rehab", "Świadczenie rehabilitacyjne", "Po 270 dniach L4 — w ciąży 100%", Institution.ZUS, "okres-zasilkowy", null, null),
    ZWZM("zwzm", "Zasiłek w wysokości zasiłku macierzyńskiego", "Utrata pracy w ciąży — 100% do porodu", Institution.ZUS, "utrata-pracy", null, null),
    MAC("mac", "Zasiłek macierzyński — urlop macierzyński", "20–37 tygodni, 100%", Institution.ZUS, "urlop-mac", null, "macierzynski"),
    RODZ("rodz", "Zasiłek macierzyński — urlop rodzicielski", "41/43 tyg., 70% lub 81,5%", Institution.ZUS, "rodzicielski", "w-rodzicielski",
            "macierzynski"),
    WARIANT("wariant", "Decyzja: 81,5% czy 100% + 70%?", "Masz 21 dni po porodzie", Institution.EMPLOYER, "wysokosc-mac", "w-81", "macierzynski"),
    UZUP("uzup", "Uzupełniający urlop macierzyński (wcześniaki i hospitalizacja)", "Do 8 lub 15 tyg., 100%", Institution.EMPLOYER, "uzupelniajacy",
            "w-uzupelniajacy", "uzupelniajacy"),
    OJCOWSKI("ojcowski", "Urlop ojcowski", "2 tygodnie, 100%", Institution.EMPLOYER, "ojcowski", "w-ojcowski", null),
    ADOPCJA("adopcja", "Urlop na warunkach urlopu macierzyńskiego (adopcja, rodzina zastępcza)", "Jak macierzyński, min. 9 tyg.",
            Institution.EMPLOYER, "na-warunkach", "w-adopcja", null),
    ZAZYCIEM("zazyciem", "Wydłużony rodzicielski „Za życiem”", "65/67 tygodni", Institution.EMPLOYER, "za-zyciem", null, null),
    OPIEKUNCZY("opiekunczy", "Zasiłek opiekuńczy", "80%, do 60 dni w roku", Institution.ZUS, "opiekunczy", "w-opiekunczy", null),
    RYZYKA("ryzyka", "Ryzyka: kiedy można stracić albo obniżyć zasiłek", "Sprawdź, zanim zmienisz pracę w ciąży", Institution.INFO, "ryzyka", null,
            null),
    OCHRONA("ochrona", "Twoje prawa w pracy", "Ochrona przed zwolnieniem i więcej", Institution.EMPLOYER, "utrata-pracy", null, null);

    private final String key;
    private final String title;
    private final String summary;
    private final Institution institution;
    private final String articleId;
    private final String wizardId;
    private final String calculator;

    CatalogBenefit(String key, String title, String summary, Institution institution, String articleId,
            String wizardId, String calculator) {
        this.key = key;
        this.title = title;
        this.summary = summary;
        this.institution = institution;
        this.articleId = articleId;
        this.wizardId = wizardId;
        this.calculator = calculator;
    }

    public String key() {
        return key;
    }

    public String title() {
        return title;
    }

    public String summary() {
        return summary;
    }

    public Institution institution() {
        return institution;
    }

    public String articleId() {
        return articleId;
    }

    public String wizardId() {
        return wizardId;
    }

    public String calculator() {
        return calculator;
    }
}
