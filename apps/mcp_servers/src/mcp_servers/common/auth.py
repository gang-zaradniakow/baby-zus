"""Token dostępu do serwerów MCP (§7: wywołanie ograniczone do danych zalogowanego użytkownika).

API po uwierzytelnieniu sesji wystawia krótkotrwały token podpisany HMAC-SHA256 i przekazuje
go w ``_meta`` wywołania narzędzia (klucz ``TOKEN_META_KEY``). Serwer MCP sprawdza podpis
i ważność wspólnym sekretem (``MCP_TOKEN_SECRET``) – bez dostępu do bazy sesji.
Token niesie tylko pseudonim użytkownika i identyfikator sesji – nigdy PESEL.
"""

import base64
import hashlib
import hmac
import json
from dataclasses import dataclass
from datetime import datetime
from typing import Final

TOKEN_META_KEY: Final = "pl.gov.zus.asystent/accessToken"  # noqa: S105 – nazwa klucza
MIN_SECRET_LENGTH: Final = 16


class InvalidTokenError(Exception):
    """Brak tokenu, zły podpis, zły format albo token wygasł."""


@dataclass(frozen=True, slots=True)
class Principal:
    user_ref: str
    """Pseudonim użytkownika (``profileId``)."""
    session_id: str | None = None
    """Identyfikator sesji API – wiąże wpis audytu z sesją."""


def _b64(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def _unb64(text: str) -> bytes:
    return base64.urlsafe_b64decode(text + "=" * (-len(text) % 4))


class TokenSigner:
    def __init__(self, secret: str) -> None:
        if len(secret) < MIN_SECRET_LENGTH:
            raise ValueError(f"sekret tokenów MCP musi mieć co najmniej {MIN_SECRET_LENGTH} znaków")
        self._key = secret.encode()

    def _signature(self, payload: str) -> str:
        return _b64(hmac.new(self._key, payload.encode(), hashlib.sha256).digest())

    def issue(self, principal: Principal, expires_at: datetime) -> str:
        claims = {"sub": principal.user_ref, "exp": int(expires_at.timestamp())}
        if principal.session_id is not None:
            claims["sid"] = principal.session_id
        payload = _b64(json.dumps(claims, separators=(",", ":")).encode())
        return f"{payload}.{self._signature(payload)}"

    def verify(self, token: str, now: datetime) -> Principal:
        payload, _, signature = token.partition(".")
        if not payload or not hmac.compare_digest(signature, self._signature(payload)):
            raise InvalidTokenError("niepoprawny podpis tokenu")
        try:
            claims = json.loads(_unb64(payload))
            subject, expires = claims["sub"], claims["exp"]
        except ValueError, KeyError, TypeError:
            raise InvalidTokenError("niepoprawny format tokenu") from None
        if not isinstance(subject, str) or not isinstance(expires, int) or not subject:
            raise InvalidTokenError("niepoprawne pola tokenu")
        if now.timestamp() >= expires:
            raise InvalidTokenError("token wygasł")
        session_id = claims.get("sid")
        return Principal(subject, session_id if isinstance(session_id, str) else None)
