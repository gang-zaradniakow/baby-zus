"""Zestaw parametrów od 19.03.2025: poprzedni zestaw + uzupełniający urlop macierzyński
dla rodziców wcześniaków i noworodków hospitalizowanych (ustawa z 6 grudnia 2024 r.,
Dz. U. z 2024 r. poz. 1871).

Zmiana od 6.08.2025 (martwe urodzenie) dotyczyła wyłącznie dokumentów (rozporządzenia),
nie wartości parametrów – dlatego nie ma osobnego zestawu.

Aktualny zestaw. Przy kolejnej zmianie przepisów: ustaw tu ``valid_to`` i dodaj nowy moduł.
"""

from dataclasses import replace
from datetime import date
from decimal import Decimal

from rules_engine.params import v2023_04_26
from rules_engine.params.base import ParamSet, kp, param, uz

PARAMS: ParamSet = replace(
    v2023_04_26.PARAMS,
    valid_from=date(2025, 3, 19),
    valid_to=None,
    rate_supplementary_maternity=param(
        Decimal("1.00"),
        "Stawka zasiłku za uzupełniający urlop macierzyński",
        uz("art. 31", to_verify=True),
    ),
    supplementary_maternity_max_weeks=param(
        (8, 15),
        "Maksymalny wymiar uzupełniającego urlopu macierzyńskiego (do 8 albo do 15 tygodni – "
        "zależnie od tygodnia ciąży, masy urodzeniowej i hospitalizacji; szczegóły: ZUS-18)",
        kp("przepisy o uzupełniającym urlopie macierzyńskim", to_verify=True),
    ),
)
