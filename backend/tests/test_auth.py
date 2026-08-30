import pytest
from fastapi import HTTPException

from app.auth import hash_value, validate_redirect_uri
from app.config import Settings


def test_admin_ids_are_read_from_backend_environment() -> None:
    settings = Settings(discord_admin_ids="123, 456,123")

    assert settings.admin_ids == {"123", "456"}


def test_redirect_uri_must_be_allowlisted() -> None:
    settings = Settings(
        discord_redirect_uri="https://example.com/api/auth/callback",
        allowed_return_urls="https://example.com/api/auth/callback",
    )

    validate_redirect_uri(settings, "https://example.com/api/auth/callback")

    with pytest.raises(HTTPException) as error:
        validate_redirect_uri(settings, "https://attacker.example/callback")

    assert error.value.status_code == 400


def test_session_values_are_hashed() -> None:
    assert hash_value("session-token") != "session-token"
    assert hash_value("session-token") == hash_value("session-token")
