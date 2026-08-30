from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "wired-links-api"
    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/wired_links"

    discord_client_id: str = ""
    discord_client_secret: str = ""
    discord_redirect_uri: str = "http://localhost:5173/api/auth/callback"
    discord_api_url: str = "https://discord.com/api"

    discord_admin_ids: str = ""
    allowed_return_urls: str = "http://localhost:5173/api/auth/callback"
    session_ttl_seconds: int = 604800
    cors_origins: str = "http://localhost:5173"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @property
    def admin_ids(self) -> set[str]:
        return {item.strip() for item in self.discord_admin_ids.split(",") if item.strip()}

    @property
    def allowed_origins(self) -> list[str]:
        return [item.strip() for item in self.cors_origins.split(",") if item.strip()]

    @property
    def allowed_redirects(self) -> set[str]:
        redirects = {
            self.discord_redirect_uri.strip(),
            *(item.strip() for item in self.allowed_return_urls.split(",") if item.strip()),
        }
        return {item for item in redirects if item}


@lru_cache
def get_settings() -> Settings:
    return Settings()
