"""Token dostępu MCP: podpis HMAC, ważność, pseudonim i sesja (wspólny kontrakt API/MCP)."""

from datetime import UTC, datetime, timedelta

import pytest

from contracts.access_token import InvalidTokenError, Principal, TokenSigner, _b64

NOW = datetime(2026, 11, 22, 9, 0, tzinfo=UTC)
SIGNER = TokenSigner("test-secret-0123456789")


def test_issue_and_verify_roundtrip() -> None:
    token = SIGNER.issue(Principal("persona-t01", "sesja-1"), NOW + timedelta(minutes=5))
    assert SIGNER.verify(token, NOW) == Principal("persona-t01", "sesja-1")


def test_token_without_session() -> None:
    token = SIGNER.issue(Principal("persona-t01"), NOW + timedelta(minutes=5))
    assert SIGNER.verify(token, NOW).session_id is None


def test_expired_token_is_rejected() -> None:
    token = SIGNER.issue(Principal("persona-t01"), NOW + timedelta(minutes=5))
    with pytest.raises(InvalidTokenError, match="wygasł"):
        SIGNER.verify(token, NOW + timedelta(minutes=5))


def test_token_from_other_secret_is_rejected() -> None:
    other = TokenSigner("inny-sekret-0123456789")
    token = other.issue(Principal("persona-t01"), NOW + timedelta(minutes=5))
    with pytest.raises(InvalidTokenError, match="podpis"):
        SIGNER.verify(token, NOW)


def test_tampered_subject_is_rejected() -> None:
    token = SIGNER.issue(Principal("persona-t01"), NOW + timedelta(minutes=5))
    _, signature = token.split(".")
    forged = _b64(b'{"sub":"persona-t02","exp":9999999999}')
    with pytest.raises(InvalidTokenError):
        SIGNER.verify(f"{forged}.{signature}", NOW)


def _signed(payload: bytes) -> str:
    encoded = _b64(payload)
    return f"{encoded}.{SIGNER._signature(encoded)}"


@pytest.mark.parametrize(
    "payload",
    [b"nie-json", b'{"exp":9999999999}', b'{"sub":"","exp":9999999999}', b'{"sub":"u","exp":"x"}'],
)
def test_malformed_claims_are_rejected(payload: bytes) -> None:
    with pytest.raises(InvalidTokenError):
        SIGNER.verify(_signed(payload), NOW)


def test_non_text_session_is_ignored() -> None:
    assert SIGNER.verify(_signed(b'{"sub":"u","exp":9999999999,"sid":7}'), NOW).session_id is None


@pytest.mark.parametrize("token", ["", ".", "bez-kropki"])
def test_garbage_is_rejected(token: str) -> None:
    with pytest.raises(InvalidTokenError):
        SIGNER.verify(token, NOW)


def test_short_secret_is_rejected() -> None:
    with pytest.raises(ValueError, match="16"):
        TokenSigner("krotki")
