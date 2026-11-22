"""Wartości parametrów i ich podstawy prawne (TE-03, TE-04).

Tabela poniżej to niezależny odpis §6.1 dokumentu założeń – NIE kopiujemy wartości z kodu.
Zmiana wartości w kodzie bez zmiany tutaj (czyli bez świadomej decyzji) obleje test.
"""

from dataclasses import FrozenInstanceError
from decimal import Decimal
from typing import Any
from urllib.parse import urlsplit

import pytest

from rules_engine.params import (
    PARAM_SETS,
    Param,
    ParamSet,
    current_params,
    v2023_04_26,
    v2025_03_19,
)
from rules_engine.params.base import kp

# §6.1 – wartości wspólne dla obu zestawów (od 26.04.2023)
SPEC_TABLE: dict[str, Any] = {
    "rate_maternity": Decimal("1.00"),
    "rate_paternity": Decimal("1.00"),
    "rate_parental": Decimal("0.70"),
    "rate_uniform": Decimal("0.815"),
    "rate_sickness_pregnancy": Decimal("1.00"),
    "uniform_rate_application_days": 21,
    "waiting_period_mandatory_days": 30,
    "waiting_period_voluntary_days": 90,
    "sickness_period_pregnancy_days": 270,
    "employer_sick_pay_days": 33,
    "employer_sick_pay_days_after_threshold": 14,
    "employer_sick_pay_days_age_threshold": 50,
    "maternity_mandatory_weeks": 14,
    "maternity_prenatal_max_weeks": 6,
    "parental_leave_weeks_single": 41,
    "parental_leave_weeks_multiple": 43,
    "parental_nontransferable_weeks": 9,
    "parental_max_parts": 5,
    "parental_deadline_child_age_years": 6,
    "paternity_leave_days": 14,
    "paternity_max_parts": 2,
    "paternity_min_part_days": 7,
    "paternity_deadline_months": 12,
    "stillbirth_leave_weeks": 8,
    "child_death_age_limit_weeks": 8,
    "child_death_min_leave_days": 7,
    "part_time_max_fraction": Decimal("0.5"),
    "foster_child_max_age": 7,
    "foster_child_max_age_school_deferral": 10,
    "adoption_child_max_age": 14,
    "payer_threshold_insured": 20,
}


# --- TE-04: zgodność z §6.1 -------------------------------------------------------------


@pytest.mark.parametrize("param_set", PARAM_SETS, ids=lambda s: s.version_id)
@pytest.mark.parametrize("name", sorted(SPEC_TABLE))
def test_params_match_spec_table(param_set: ParamSet, name: str) -> None:
    assert getattr(param_set, name).value == SPEC_TABLE[name]


def test_supplementary_maternity_leave_exists_only_from_2025_03_19() -> None:
    assert v2023_04_26.PARAMS.rate_supplementary_maternity is None
    assert v2023_04_26.PARAMS.supplementary_maternity_max_weeks is None

    current = v2025_03_19.PARAMS
    assert current.rate_supplementary_maternity is not None
    assert current.rate_supplementary_maternity.value == Decimal("1.00")
    assert current.supplementary_maternity_max_weeks is not None
    assert current.supplementary_maternity_max_weeks.value == (8, 15)


def test_2025_set_changes_only_supplementary_leave() -> None:
    """Nowy zestaw = poprzedni + zmiany; ten test dokumentuje, co się zmieniło."""
    old, new = v2023_04_26.PARAMS, v2025_03_19.PARAMS
    changed = {
        name
        for name, value in vars_of(new).items()
        if name not in {"valid_from", "valid_to"} and value != vars_of(old)[name]
    }
    assert changed == {"rate_supplementary_maternity", "supplementary_maternity_max_weeks"}


def vars_of(param_set: ParamSet) -> dict[str, Any]:
    return {name: getattr(param_set, name) for name in param_set.__dataclass_fields__}


@pytest.mark.parametrize(
    ("children", "weeks"), [(1, 20), (2, 31), (3, 33), (4, 35), (5, 37), (6, 37), (8, 37)]
)
def test_maternity_weeks_by_children(children: int, weeks: int) -> None:
    assert current_params().maternity_weeks_for(children) == weeks


@pytest.mark.parametrize(
    ("children", "za_zyciem", "weeks"),
    [(1, False, 41), (2, False, 43), (3, False, 43), (1, True, 65), (2, True, 67)],
)
def test_parental_weeks(children: int, za_zyciem: bool, weeks: int) -> None:
    assert current_params().parental_weeks_for(children, za_zyciem=za_zyciem) == weeks


@pytest.mark.parametrize("method", ["maternity_weeks_for", "parental_weeks_for"])
def test_weeks_reject_zero_children(method: str) -> None:
    with pytest.raises(ValueError, match="≥ 1"):
        getattr(current_params(), method)(0)


# --- TE-03: podstawy prawne -------------------------------------------------------------


@pytest.mark.parametrize("param_set", PARAM_SETS, ids=lambda s: s.version_id)
def test_every_param_has_legal_basis_with_isap_link(param_set: ParamSet) -> None:
    params = dict(param_set.iter_params())
    assert len(params) >= len(SPEC_TABLE)
    for name, p in params.items():
        assert p.basis, name
        assert p.description, name
        for basis in p.basis:
            url = urlsplit(basis.url)
            assert url.scheme == "https", name
            assert url.hostname == "isap.sejm.gov.pl", name
            assert basis.article.startswith(("art.", "przepisy")), name


def test_param_without_legal_basis_is_rejected() -> None:
    with pytest.raises(ValueError, match="nie ma podstawy prawnej"):
        Param(value=1, description="bez źródła", basis=())


def test_float_values_are_rejected() -> None:
    with pytest.raises(TypeError, match="Decimal"):
        Param(value=0.815, description="stawka", basis=(kp("art. 1"),))


def test_rates_and_fractions_are_decimals() -> None:
    for name, p in current_params().iter_params():
        if name.startswith("rate_") or name.endswith("_fraction"):
            assert isinstance(p.value, Decimal), name


def test_legal_basis_renders_human_readable() -> None:
    assert str(kp("art. 180")) == "Kodeks pracy, art. 180"


# --- niemutowalność -----------------------------------------------------------------


def test_param_sets_are_immutable() -> None:
    with pytest.raises(FrozenInstanceError):
        current_params().valid_to = None  # type: ignore[misc]
    with pytest.raises(FrozenInstanceError):
        current_params().rate_uniform.value = Decimal("0.9")  # type: ignore[misc]


def test_maternity_table_must_start_with_one_child() -> None:
    from dataclasses import replace

    from rules_engine.params.base import param

    with pytest.raises(ValueError, match="od 1 dziecka"):
        replace(
            current_params(),
            maternity_leave_weeks=param(((2, 31),), "zła tabela", kp("art. 180")),
        )
