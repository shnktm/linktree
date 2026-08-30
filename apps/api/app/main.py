from contextlib import asynccontextmanager
from urllib.parse import urlencode

from fastapi import Depends, FastAPI, HTTPException, Query, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from .auth import (
    bearer_scheme,
    cleanup_expired_states,
    ensure_discord_configured,
    exchange_discord_code,
    get_session,
    revoke_session,
    save_oauth_state,
    validate_redirect_uri,
)
from .config import get_settings
from .database import get_db, init_db
from .schemas import OAuthExchangeRequest, OAuthExchangeResponse


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    yield


settings = get_settings()

app = FastAPI(title=settings.app_name, lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.get("/api/health", tags=["system"])
def health() -> dict[str, str]:
    return {"status": "ok", "service": settings.app_name}


@app.get("/api/discord/redirect", response_class=RedirectResponse, tags=["discord"])
def discord_redirect(
    return_url: str = Query(min_length=1, max_length=2048),
    state: str = Query(min_length=16, max_length=512),
    db: Session = Depends(get_db),
) -> RedirectResponse:
    ensure_discord_configured(settings)
    validate_redirect_uri(settings, return_url)
    cleanup_expired_states(db)
    save_oauth_state(db, state, return_url)

    params = urlencode(
        {
            "client_id": settings.discord_client_id,
            "response_type": "code",
            "redirect_uri": return_url,
            "scope": "identify email",
            "state": state,
        }
    )
    authorize_url = f"{settings.discord_api_url.rstrip('/')}/oauth2/authorize?{params}"
    return RedirectResponse(authorize_url, status_code=status.HTTP_307_TEMPORARY_REDIRECT)


@app.post("/api/exchange", response_model=OAuthExchangeResponse, tags=["discord"])
async def exchange(
    payload: OAuthExchangeRequest,
    db: Session = Depends(get_db),
) -> OAuthExchangeResponse:
    return await exchange_discord_code(db, payload, settings)


@app.get("/api/verify", status_code=status.HTTP_204_NO_CONTENT, tags=["sessions"])
def verify(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> Response:
    if get_session(db, credentials) is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@app.api_route("/api/logout", methods=["GET", "POST"], tags=["sessions"])
def logout(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> Response:
    revoke_session(db, credentials)
    if request.method == "GET":
        return RedirectResponse("/", status_code=status.HTTP_303_SEE_OTHER)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
