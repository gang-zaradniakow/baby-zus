"""Katalog intencji i listy pytań dla etapów (TE-08, TE-09)."""

from typing import Any, get_args

import pytest
from pydantic import BaseModel

from contracts import Category, Flag, Profile, Stage, StageInfo
from rules_engine.catalog import (
    FEATURED,
    FIELD_QUESTIONS,
    INTENTS,
    INTENTS_BY_ID,
    featured_intents,
    get_intent,
    search_intents,
)
from rules_engine.catalog.featured import MAX_FEATURED, MIN_FEATURED

# Liczba pytań w każdej kategorii §4 (łącznie z propozycjami ➕).
EXPECTED_PER_CATEGORY = {"A": 9, "B": 7, "C": 8, "D": 7, "E": 6, "F": 9, "G": 8, "H": 7}


def profile_paths(model: type[BaseModel] = Profile, prefix: str = "") -> set[str]:
    """Wszystkie ścieżki pól profilu w JSON (camelCase), np. ``child.birthDate``."""
    paths: set[str] = set()
    for name, field in model.model_fields.items():
        path = f"{prefix}{field.alias or name}"
        paths.add(path)
        candidates = [field.annotation, *get_args(field.annotation)]
        for candidate in candidates:
            if isinstance(candidate, type) and issubclass(candidate, BaseModel):
                paths |= profile_paths(candidate, f"{path}.")
    return paths


# --- TE-09: spójność katalogu ------------------------------------------------------------


def test_catalog_matches_spec_section_4() -> None:
    counts: dict[str, int] = {}
    for intent in INTENTS:
        counts[intent.category.value] = counts.get(intent.category.value, 0) + 1
    assert counts == EXPECTED_PER_CATEGORY
    assert len(INTENTS_BY_ID) == len(INTENTS)  # unikalne id


def test_intent_ids_are_numbered_within_category() -> None:
    for category in Category:
        ids = [i.id for i in INTENTS if i.category is category]
        numbers = [int(i.split("_")[0].split(".")[1]) for i in ids]
        assert numbers == list(range(1, len(ids) + 1)), category


def test_every_required_field_is_a_profile_path_with_a_question() -> None:
    paths = profile_paths()
    for intent in INTENTS:
        for field in intent.required_fields:
            assert field in paths, f"{intent.id}: {field} nie istnieje w profilu"
            assert field in FIELD_QUESTIONS, f"{intent.id}: brak pytania o {field}"


def test_every_field_question_points_to_profile() -> None:
    assert set(FIELD_QUESTIONS) <= profile_paths()


def test_priorities_follow_catalog_order() -> None:
    priorities = [i.priority for i in INTENTS]
    assert priorities == sorted(priorities)
    assert len(set(priorities)) == len(priorities)


def test_get_intent() -> None:
    assert get_intent("B.01_wysokosc_macierzynskiego").category is Category.AMOUNTS
    with pytest.raises(KeyError, match="nieznana intencja"):
        get_intent("Z.99_nie_ma")


# --- TE-08: listy 5–8 pytań na etap ------------------------------------------------------


@pytest.mark.parametrize("key", list(FEATURED), ids=str)
def test_each_featured_list_has_5_to_8_unique_intents(key: Stage | Flag | None) -> None:
    ids = FEATURED[key]
    assert MIN_FEATURED <= len(ids) <= MAX_FEATURED
    assert len(set(ids)) == len(ids)
    for intent_id in ids:
        assert intent_id in INTENTS_BY_ID


@pytest.mark.parametrize("key", [k for k in FEATURED if k is not None], ids=str)
def test_featured_intents_apply_to_their_stage_or_flag(key: Stage | Flag) -> None:
    """Wyróżnione pytanie musi pasować do etapu/flagi wg katalogu §4."""
    for intent_id in FEATURED[key]:
        intent = INTENTS_BY_ID[intent_id]
        applies = key in intent.stages if isinstance(key, Stage) else key in intent.flags
        assert applies, f"{intent_id} wyróżnione dla {key}, ale katalog go tam nie przewiduje"


def test_every_stage_and_flag_has_a_list() -> None:
    assert set(FEATURED) == {*Stage, *Flag, None}


@pytest.mark.parametrize(
    ("stage", "flags", "first"),
    [
        (Stage.E0, [], "A.02_chorobowy_w_ciazy"),
        (Stage.E1, [], "C.07_urlop_przed_porodem"),
        (Stage.E2, [], "C.04_termin_wniosku"),
        (Stage.E3, [], "D.02_podzial_rodzicielskiego"),
        (None, [], "A.01_prawo_do_macierzynskiego"),
        (Stage.E2, [Flag.ADOPTION], "F.04_rodzice_adopcyjni"),
        (Stage.E2, [Flag.DIFFICULT], "F.06_martwe_urodzenie_smierc_dziecka"),
        (Stage.E2, [Flag.ADOPTION, Flag.DIFFICULT], "F.06_martwe_urodzenie_smierc_dziecka"),
    ],
)
def test_featured_intents_for_user(stage: Stage | None, flags: list[Flag], first: str) -> None:
    intents = featured_intents(StageInfo(stage=stage, flags=flags))
    assert intents[0].id == first
    assert MIN_FEATURED <= len(intents) <= MAX_FEATURED
    assert len({i.id for i in intents}) == len(intents)


def test_difficult_path_hides_regular_stage_questions() -> None:
    ids = {i.id for i in featured_intents(StageInfo(stage=Stage.E2, flags=[Flag.DIFFICULT]))}
    assert "B.04_warianty_urlopu" not in ids
    assert "G.07_akt_urodzenia" not in ids


def test_adoption_list_adds_stage_questions_after_adoption_ones() -> None:
    intents = featured_intents(StageInfo(stage=Stage.E3, flags=[Flag.ADOPTION]))
    ids = [i.id for i in intents]
    assert ids[:2] == ["F.04_rodzice_adopcyjni", "F.05_rodzina_zastepcza"]
    assert "D.02_podzial_rodzicielskiego" in ids
    assert len(ids) == MAX_FEATURED


# --- wyszukiwarka ------------------------------------------------------------------------


@pytest.mark.parametrize(
    ("query", "expected"),
    [
        ("ojcowski", "C.08_urlop_ojcowski"),
        ("zasilek macierzynski", "A.01_prawo_do_macierzynskiego"),  # bez polskich znaków
        ("AKT URODZENIA", "G.07_akt_urodzenia"),
        ("poronienie", "F.09_poronienie"),
    ],
)
def test_search_intents(query: str, expected: str) -> None:
    assert search_intents(query)[0].id == expected


@pytest.mark.parametrize("query", ["", "a b", "kryptowaluty"])
def test_search_without_matches_returns_empty(query: str) -> None:
    assert search_intents(query) == []


def test_search_respects_limit() -> None:
    results: list[Any] = search_intents("zasiłek", limit=3)
    assert len(results) == 3
