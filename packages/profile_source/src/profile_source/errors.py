"""Wyjątki domenowe źródła profilu – reszta systemu nie widzi błędów HTTP ani httpx."""


class ProfileSourceError(Exception):
    """Baza wszystkich błędów źródła profilu."""


class ProfileNotFoundError(ProfileSourceError):
    """Backend nie zna użytkownika (albo brak danych drugiego rodzica)."""

    def __init__(self, user_ref: str) -> None:
        super().__init__(f"brak profilu dla '{user_ref}'")
        self.user_ref = user_ref


class ConsentRequiredError(ProfileSourceError):
    """Dane drugiego rodzica są dostępne tylko za jego zgodą (§7)."""

    def __init__(self, user_ref: str) -> None:
        super().__init__(f"brak zgody drugiego rodzica na udostępnienie danych ('{user_ref}')")
        self.user_ref = user_ref


class BackendUnavailableError(ProfileSourceError):
    """Backend nie odpowiedział poprawnie mimo ponowień (timeout, 429, 5xx)."""

    def __init__(self, message: str, attempts: int) -> None:
        super().__init__(f"{message} (prób: {attempts})")
        self.attempts = attempts


class BackendContractError(ProfileSourceError):
    """Odpowiedź niezgodna z kontraktem – ponawianie nic nie da."""

    def __init__(self, message: str, fields: tuple[str, ...] = ()) -> None:
        detail = f"; pola: {', '.join(fields)}" if fields else ""
        super().__init__(f"{message}{detail}")
        self.fields = fields


class ConfigurationError(ProfileSourceError, ValueError):
    """Zła konfiguracja adaptera – zgłaszana przy starcie aplikacji."""
