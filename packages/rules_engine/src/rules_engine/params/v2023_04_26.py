"""Zestaw parametrów od 26.04.2023 (nowelizacja Kodeksu pracy wdrażająca dyrektywę
work-life balance: 41/43 tyg. rodzicielskiego, 9 tyg. nieprzenoszalnych, 81,5% i 70%).

Zastąpiony 19.03.2025 przez ``v2025_03_19`` (uzupełniający urlop macierzyński).
NIE ZMIENIAĆ – zestaw opisuje stan prawa dla zdarzeń z tego okresu.
"""

from datetime import date
from decimal import Decimal

from rules_engine.params.base import ParamSet, kp, param, usus, uz

PARAMS = ParamSet(
    valid_from=date(2023, 4, 26),
    valid_to=date(2025, 3, 18),
    # --- stawki ---
    rate_maternity=param(
        Decimal("1.00"),
        "Stawka zasiłku za urlop macierzyński i na warunkach urlopu macierzyńskiego",
        uz("art. 31"),
    ),
    rate_parental=param(
        Decimal("0.70"),
        "Stawka zasiłku za urlop rodzicielski (w tym 9 tygodni drugiego rodzica)",
        uz("art. 31"),
    ),
    rate_uniform=param(
        Decimal("0.815"),
        "Stawka jednolita za cały okres macierzyńskiego i rodzicielskiego (wniosek do 21 dni)",
        uz("art. 31"),
    ),
    rate_paternity=param(
        Decimal("1.00"),
        "Stawka zasiłku za urlop ojcowski",
        uz("art. 31"),
    ),
    rate_equivalent_maternity=param(
        Decimal("1.00"),
        "Zasiłek w wysokości zasiłku macierzyńskiego (rozwiązanie umowy w ciąży: "
        "upadłość lub likwidacja pracodawcy)",
        uz("art. 30"),
    ),
    rate_sickness_pregnancy=param(
        Decimal("1.00"),
        "Stawka zasiłku chorobowego za niezdolność do pracy w czasie ciąży (kod B)",
        uz("art. 11"),
    ),
    rate_supplementary_maternity=None,  # uzupełniający urlop macierzyński od 19.03.2025
    uniform_rate_application_days=param(
        21,
        "Termin (dni od porodu lub przyjęcia dziecka) na wniosek o stawkę jednolitą 81,5%",
        uz("art. 31"),
    ),
    # --- zasiłek chorobowy ---
    waiting_period_mandatory_days=param(
        30, "Okres wyczekiwania – obowiązkowe ubezpieczenie chorobowe", uz("art. 4")
    ),
    waiting_period_voluntary_days=param(
        90, "Okres wyczekiwania – dobrowolne ubezpieczenie chorobowe", uz("art. 4")
    ),
    sickness_period_pregnancy_days=param(
        270, "Okres zasiłkowy, gdy niezdolność przypada w czasie ciąży", uz("art. 8")
    ),
    employer_sick_pay_days=param(
        33, "Dni wynagrodzenia chorobowego płaconego przez pracodawcę w roku", kp("art. 92")
    ),
    employer_sick_pay_days_age_threshold=param(
        50, "Wiek, po którego ukończeniu pracodawca płaci krócej", kp("art. 92")
    ),
    employer_sick_pay_days_after_threshold=param(
        14,
        "Dni wynagrodzenia chorobowego od roku następującego po ukończeniu 50 lat",
        kp("art. 92"),
    ),
    # --- urlop macierzyński ---
    maternity_leave_weeks=param(
        ((1, 20), (2, 31), (3, 33), (4, 35), (5, 37)),
        "Wymiar urlopu macierzyńskiego wg liczby dzieci przy jednym porodzie (5 i więcej: 37)",
        kp("art. 180"),
    ),
    maternity_mandatory_weeks=param(
        14, "Część urlopu macierzyńskiego, którą matka musi wykorzystać po porodzie", kp("art. 180")
    ),
    maternity_prenatal_max_weeks=param(
        6,
        "Maksymalna część urlopu macierzyńskiego przed przewidywaną datą porodu",
        kp("art. 180"),
    ),
    stillbirth_leave_weeks=param(
        8,
        "Urlop macierzyński po urodzeniu martwego dziecka lub zgonie dziecka",
        kp("art. 180¹ § 1"),
    ),
    child_death_age_limit_weeks=param(
        8,
        "Zgon dziecka przed ukończeniem tylu tygodni życia skraca urlop macierzyński",
        kp("art. 180¹ § 1"),
    ),
    child_death_min_leave_days=param(
        7, "Minimalny urlop od dnia zgonu dziecka", kp("art. 180¹ § 1")
    ),
    supplementary_maternity_max_weeks=None,
    # --- urlop rodzicielski ---
    parental_leave_weeks_single=param(
        41, "Urlop rodzicielski – jedno dziecko (łącznie dla obojga rodziców)", kp("art. 182¹a")
    ),
    parental_leave_weeks_multiple=param(
        43,
        "Urlop rodzicielski – więcej niż jedno dziecko przy jednym porodzie",
        kp("art. 182¹a"),
    ),
    parental_leave_weeks_za_zyciem_single=param(
        65, "Urlop rodzicielski – dziecko z zaświadczeniem „Za życiem”", kp("art. 182¹a")
    ),
    parental_leave_weeks_za_zyciem_multiple=param(
        67, "Urlop rodzicielski – „Za życiem”, więcej niż jedno dziecko", kp("art. 182¹a")
    ),
    parental_nontransferable_weeks=param(
        9,
        "Tygodnie urlopu rodzicielskiego przysługujące wyłącznie każdemu z rodziców",
        kp("art. 182¹a"),
    ),
    parental_max_parts=param(
        5, "Maksymalna liczba części urlopu rodzicielskiego", kp("art. 182¹b")
    ),
    parental_deadline_child_age_years=param(
        6,
        "Urlop rodzicielski do końca roku kalendarzowego, w którym dziecko kończy tyle lat",
        kp("art. 182¹b"),
    ),
    part_time_max_fraction=param(
        Decimal("0.5"),
        "Maksymalny wymiar pracy łączonej z urlopem rodzicielskim",
        kp("art. 182¹e"),
    ),
    # --- urlop ojcowski ---
    paternity_leave_days=param(14, "Wymiar urlopu ojcowskiego (2 tygodnie)", kp("art. 182³")),
    paternity_max_parts=param(2, "Maksymalna liczba części urlopu ojcowskiego", kp("art. 182³")),
    paternity_min_part_days=param(
        7, "Minimalna długość części urlopu ojcowskiego", kp("art. 182³")
    ),
    paternity_deadline_months=param(
        12,
        "Termin wykorzystania urlopu ojcowskiego (miesiące od urodzenia lub "
        "uprawomocnienia przysposobienia)",
        kp("art. 182³"),
    ),
    # --- adopcja i rodzina zastępcza ---
    adoption_child_max_age=param(
        14,
        "Maksymalny wiek dziecka przyjętego do przysposobienia (urlop na warunkach "
        "macierzyńskiego)",
        kp("art. 183"),
    ),
    foster_child_max_age=param(
        7, "Maksymalny wiek dziecka w rodzinie zastępczej niezawodowej", kp("art. 183")
    ),
    foster_child_max_age_school_deferral=param(
        10, "Jw., gdy odroczono obowiązek szkolny", kp("art. 183")
    ),
    # --- płatnik i podstawa wymiaru ---
    payer_threshold_insured=param(
        20,
        "Płatnik wypłaca zasiłki, gdy na 30.11 poprzedniego roku zgłaszał więcej "
        "niż tylu ubezpieczonych",
        uz("art. 61"),
    ),
    default_deduction_rate=param(
        Decimal("0.1371"),
        "Domyślna stopa składek potrącanych z przychodu przy ustalaniu podstawy "
        "(9,76% + 1,5% + 2,45%); w sprawach – wartość ze sprawy (U7)",
        uz("art. 3", to_verify=True),
        usus("art. 22", to_verify=True),
    ),
)
