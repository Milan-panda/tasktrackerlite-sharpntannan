from functools import lru_cache

from pydantic import EmailStr, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file="../.env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str
    secret_key: str = Field(min_length=32)
    environment: str = "production"
    session_cookie_name: str = "session"
    session_expire_minutes: int = Field(default=10080, gt=0)
    admin_name: str = Field(min_length=1)
    admin_email: EmailStr
    admin_password: str = Field(min_length=8)

    @property
    def secure_cookies(self) -> bool:
        return self.environment.lower() != "dev"


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]


settings = get_settings()
