from typing import Literal

from pydantic import BaseModel, Field


class OAuthExchangeRequest(BaseModel):
    code: str = Field(min_length=1, max_length=512)
    state: str = Field(min_length=16, max_length=512)
    redirect_uri: str = Field(min_length=1, max_length=2048)


class DiscordUser(BaseModel):
    id: str
    username: str
    avatar: str | None = None


class OAuthExchangeResponse(BaseModel):
    access_token: str
    expires_in: int
    user: DiscordUser
    role: Literal["admin", "user"]
