"""Testy intencji z katalogu A–H (§4)."""

from collections.abc import Callable
from typing import Any

import pytest
from pydantic import ValidationError

from contracts import AnswerType, Category, Intent, Stage

type JsonDict = dict[str, Any]
MakeIntent = Callable[..., JsonDict]


def test_intent_is_valid(make_intent: MakeIntent) -> None:
    intent = Intent.model_validate(make_intent())
    assert intent.category is Category.LEAVE
    assert intent.answer_types == [AnswerType.CALCULATION]
    assert Stage.E1 in intent.stages


def test_intent_can_be_shown_only_by_flag(make_intent: MakeIntent) -> None:
    intent = Intent.model_validate(
        make_intent(id="F.04_adopcja", category="F", stages=[], flags=["ADOPTION"])
    )
    assert intent.stages == []


@pytest.mark.parametrize(
    ("overrides", "message"),
    [
        ({"id": "B.01_x"}, "nie pasuje do kategorii"),
        ({"id": "OUT_OF_CATALOG"}, "nie jest intencją katalogu"),
        ({"stages": [], "flags": []}, "co najmniej jeden etap"),
        ({"answerTypes": []}, "at least 1"),
        ({"answerTypes": ["K", "K"]}, "powtórzone"),
        ({"stages": ["E1", "E1"]}, "powtórzone"),
        ({"stages": ["E5"]}, "stages.0"),
        ({"priority": -1}, "priority"),
    ],
    ids=[
        "id_category_mismatch",
        "out_of_catalog",
        "no_stage_no_flag",
        "no_answer_type",
        "duplicate_answer_type",
        "duplicate_stage",
        "unknown_stage",
        "negative_priority",
    ],
)
def test_invalid_intents_are_rejected(
    make_intent: MakeIntent, overrides: JsonDict, message: str
) -> None:
    with pytest.raises(ValidationError, match=message):
        Intent.model_validate(make_intent(**overrides))
