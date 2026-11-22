"""Port ``ProfileSource`` – jedyny sposób, w jaki API i serwery MCP pobierają dane profilu (U8)."""

from typing import Protocol, runtime_checkable

from contracts import ParentProfile, Profile, StageInfo


@runtime_checkable
class ProfileSource(Protocol):
    """Źródło profilu użytkownika. ``user_ref`` to pseudonim – nigdy PESEL.

    Błędy: ``ProfileNotFoundError``, ``ConsentRequiredError``, ``BackendUnavailableError``,
    ``BackendContractError`` (``profile_source.errors``).
    """

    async def get_profile(self, user_ref: str) -> Profile:
        """Pełny profil sprawy (wnioskodawca, dziecko, zdarzenia, plan urlopu)."""
        ...

    async def get_partner_profile(self, user_ref: str) -> ParentProfile:
        """Dane drugiego rodzica – tylko za jego zgodą (``partnerConsent``)."""
        ...

    async def get_child_stage(self, user_ref: str) -> StageInfo:
        """Etap E0–E3 i flagi dla dziecka."""
        ...

    async def aclose(self) -> None:
        """Zwolnij zasoby (połączenia HTTP)."""
        ...
