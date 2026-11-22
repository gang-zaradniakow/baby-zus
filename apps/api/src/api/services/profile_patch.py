"""Uzupełnianie braków profilu (NEED_INFO → PATCH, ZUS-42).

Łatka ma postać częściowego JSON-a profilu (jak JSON Merge Patch, RFC 7396): obiekty są
scalane, listy zastępowane, ``null`` usuwa pole. Ścieżki pól odpowiadają ``missing[].field``
z karty (np. ``child.birthDate``), więc klient buduje łatkę wprost z listy braków.

Zasady danych: łatka nie może ustawiać ``source`` – części profilu zmienione przez
użytkownika dostają źródło ``USER`` (dane deklarowane, nie z ZUS).
"""

import copy
from typing import Any

from pydantic import Field, ValidationError

from api.errors import ApiError
from api.services.sessions import SessionRecord, SessionRepository
from contracts import FactSource, Profile
from contracts._base import ContractModel

USER = FactSource.USER.value


class ProfilePatch(ContractModel):
    """Zmieniane części profilu; pominięte pola zostają bez zmian."""

    applicant: dict[str, Any] | None = None
    partner: dict[str, Any] | None = Field(
        default=None, description="Obiekt scalany z danymi drugiego rodzica; null usuwa."
    )
    child: dict[str, Any] | None = None
    special_events: list[dict[str, Any]] | None = None
    leave_plan: list[dict[str, Any]] | None = None

    def changes(self) -> dict[str, Any]:
        """Tylko pola podane w żądaniu (``null`` też), w JSON-owych nazwach (camelCase)."""
        return self.model_dump(mode="json", exclude_unset=True)


def merge(target: dict[str, Any], patch: dict[str, Any]) -> dict[str, Any]:
    """Scalanie wg RFC 7396 – zwraca nowy słownik, ``target`` się nie zmienia."""
    result = copy.deepcopy(target)
    for key, value in patch.items():
        if value is None:
            result.pop(key, None)
        elif isinstance(value, dict) and isinstance(result.get(key), dict):
            result[key] = merge(result[key], value)
        else:
            result[key] = copy.deepcopy(value)
    return result


def _source_paths(value: Any, path: tuple[str | int, ...] = ()) -> list[tuple[str | int, ...]]:
    if isinstance(value, dict):
        found = [(*path, "source")] if "source" in value else []
        for key, item in value.items():
            found += _source_paths(item, (*path, key))
        return found
    if isinstance(value, list):
        return [p for index, item in enumerate(value) for p in _source_paths(item, (*path, index))]
    return []


def _validation_error(details: list[dict[str, Any]]) -> ApiError:
    return ApiError(422, "VALIDATION_ERROR", "Niepoprawne uzupełnienie profilu.", details)


def apply_patch(profile: Profile, patch: ProfilePatch) -> Profile:
    """Nowy profil po łatce; części zmienione przez użytkownika mają źródło USER."""
    changes = patch.changes()
    forbidden = _source_paths(changes)
    if forbidden:
        raise _validation_error(
            [
                {"loc": ["body", *p], "msg": "Źródło danych ustawia serwer.", "type": "forbidden"}
                for p in forbidden
            ]
        )

    data = merge(profile.model_dump(mode="json"), changes)
    if (changes.get("applicant") or {}).get("insurance"):
        _mark_user(data, "applicant", "insurance")
    if changes.get("partner"):
        _mark_user(data, "partner", "insurance")
    if changes.get("child"):
        _mark_user(data, "child")

    try:
        return Profile.model_validate(data)
    except ValidationError as error:
        # Ścieżki względem profilu (np. ["child", "birthDate"]) – bez wartości użytkownika.
        raise _validation_error(
            [
                {"loc": ["profile", *item["loc"]], "msg": item["msg"], "type": item["type"]}
                for item in error.errors()
            ]
        ) from None


def _mark_user(data: dict[str, Any], *path: str) -> None:
    """Ustaw ``source = USER`` w obiekcie pod ``path`` (jeśli po scaleniu istnieje)."""
    node: Any = data
    for key in path:
        node = node.get(key) if isinstance(node, dict) else None
    if isinstance(node, dict):
        node["source"] = USER


async def save_patch(
    sessions: SessionRepository, session: SessionRecord, profile: Profile, patch: ProfilePatch
) -> Profile:
    """Zastosuj łatkę i zapisz profil w sesji – kolejne odpowiedzi liczą się już z nim."""
    updated = apply_patch(profile, patch)
    await sessions.update_profile(session.id, updated.model_dump(mode="json"))
    return updated
