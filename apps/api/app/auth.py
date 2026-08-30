import hashlib
import secrets
from datetime import UTC, datetime, timedelta

import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from .config import Settings, get_settings
from .database import AuthSession, OAuthState, User, get_db
from .schemas import DiscordUser, OAuthExchangeRequest, OAuthExchangeResponse

bearer_scheme = HTTPBearer(auto_error=False)


def utc_now() -> datetime:
    return datetime.now(UTC)


def hash_value(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def ensure_discord_configured(settings: Settings) -> None:
    if not settings.discord_client_id or not settings.discord_client_secret:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Discord OAuth is not configured",
        )


def validate_redirect_uri(settings: Settings, redirect_uri: str) -> None:
    if redirect_uri not in settings.allowed_redirects:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid redirect URI")


def save_oauth_state(db: Session, state: str, redirect_uri: str) -> None:
    db.add(
        OAuthState(
            state_hash=hash_value(state),
            redirect_uri=redirect_uri,
            expires_at=utc_now() + timedelta(minutes=10),
        )
    )
    db.commit()


def consume_oauth_state(db: Session, state: str, redirect_uri: str) -> bool:
    stored = db.scalar(select(OAuthState).where(OAuthState.state_hash == hash_value(state)))
    if stored is None:
        return False

    db.delete(stored)
    db.commit()
    return stored.redirect_uri == redirect_uri and stored.expires_at > utc_now()


async def exchange_discord_code(
    db: Session,
    payload: OAuthExchangeRequest,
    settings: Settings,
) -> OAuthExchangeResponse:
    ensure_discord_configured(settings)
    validate_redirect_uri(settings, payload.redirect_uri)

    if not consume_oauth_state(db, payload.state, payload.redirect_uri):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired state",
        )

    token_url = f"{settings.discord_api_url.rstrip('/')}/oauth2/token"
    user_url = f"{settings.discord_api_url.rstrip('/')}/users/@me"

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            token_response = await client.post(
                token_url,
                data={
                    "grant_type": "authorization_code",
                    "code": payload.code,
                    "redirect_uri": payload.redirect_uri,
                },
                auth=(settings.discord_client_id, settings.discord_client_secret),
            )
            token_response.raise_for_status()
            token_data = token_response.json()
            access_token = token_data.get("access_token")
            expires_in = int(token_data.get("expires_in", 0))
            if not access_token or expires_in <= 0:
                raise ValueError("Discord did not return a valid token")

            user_response = await client.get(
                user_url,
                headers={"Authorization": f"Bearer {access_token}"},
            )
            user_response.raise_for_status()
            user_data = user_response.json()
    except (httpx.HTTPError, ValueError, TypeError) as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Discord OAuth exchange failed",
        ) from error

    discord_id = str(user_data.get("id", "")).strip()
    username = str(user_data.get("global_name") or user_data.get("username") or "").strip()
    if not discord_id or not username:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Invalid Discord profile",
        )

    user = DiscordUser(
        id=discord_id,
        username=username,
        avatar=user_data.get("avatar"),
    )
    role = "admin" if discord_id in settings.admin_ids else "user"
    token = secrets.token_urlsafe(48)
    now = utc_now()
    expires_at = now + timedelta(seconds=settings.session_ttl_seconds)

    stored_user = db.get(User, user.id)
    if stored_user is None:
        db.add(
            User(
                discord_id=user.id,
                username=user.username,
                avatar=user.avatar,
                role=role,
                created_at=now,
                updated_at=now,
            )
        )
    else:
        stored_user.username = user.username
        stored_user.avatar = user.avatar
        stored_user.role = role
        stored_user.updated_at = now

    db.add(
        AuthSession(
            token_hash=hash_value(token),
            discord_id=user.id,
            username=user.username,
            avatar=user.avatar,
            role=role,
            expires_at=expires_at,
            created_at=now,
        )
    )
    db.commit()

    return OAuthExchangeResponse(
        access_token=token,
        expires_in=settings.session_ttl_seconds,
        user=user,
        role=role,
    )


def get_session(
    db: Session,
    credentials: HTTPAuthorizationCredentials | None,
) -> AuthSession | None:
    if credentials is None or credentials.scheme.lower() != "bearer":
        return None

    session = db.scalar(
        select(AuthSession).where(AuthSession.token_hash == hash_value(credentials.credentials))
    )
    if session is None or session.revoked_at is not None or session.expires_at <= utc_now():
        return None
    session.role = "admin" if session.discord_id in get_settings().admin_ids else "user"
    return session


def require_session(
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> AuthSession:
    session = get_session(db, credentials)
    if session is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session")
    return session


def revoke_session(db: Session, credentials: HTTPAuthorizationCredentials | None) -> None:
    session = get_session(db, credentials)
    if session is None:
        return
    session.revoked_at = utc_now()
    db.commit()


def cleanup_expired_states(db: Session) -> None:
    db.execute(delete(OAuthState).where(OAuthState.expires_at <= utc_now()))
    db.commit()
