"""Application configuration, loaded from environment / .env file."""

from functools import lru_cache
from pathlib import Path
from typing import Annotated

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict

BACKEND_ROOT = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BACKEND_ROOT / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # --- Application -------------------------------------------------------
    app_name: str = "Creditxora API"
    environment: str = "development"
    api_prefix: str = "/api/v1"

    # --- Database ----------------------------------------------------------
    mongodb_uri: str = "mongodb://localhost:27017"
    mongodb_db: str = "creditxora"

    # --- Security ----------------------------------------------------------
    # Override in production. Used to sign access/refresh JWTs.
    secret_key: str = "dev-only-insecure-secret-change-me"
    access_token_ttl_minutes: int = 30
    refresh_token_ttl_days: int = 14
    jwt_algorithm: str = "HS256"

    # Fernet key used to encrypt uploaded credit reports at rest. Generated on
    # first boot into .storage_key if absent, so a dev machine never silently
    # writes plaintext PII to disk.
    storage_encryption_key: str | None = None

    # --- CORS --------------------------------------------------------------
    # NoDecode: accept a plain comma-separated string in .env rather than JSON.
    cors_origins: Annotated[list[str], NoDecode] = Field(
        default_factory=lambda: [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ]
    )

    # --- Uploads -----------------------------------------------------------
    upload_dir: Path = BACKEND_ROOT / "var" / "uploads"
    max_upload_bytes: int = 15 * 1024 * 1024  # 15 MB
    allowed_upload_types: Annotated[list[str], NoDecode] = Field(
        default_factory=lambda: [
            "application/pdf",
            "image/png",
            "image/jpeg",
            "image/webp",
            "image/heic",
        ]
    )

    # --- Notifications -----------------------------------------------------
    admin_notification_email: str = "admin@creditxora.com"
    # When unset, notification emails are written to the log and persisted in
    # the notifications collection instead of being sent over SMTP.
    smtp_host: str | None = None
    smtp_port: int = 587
    smtp_user: str | None = None
    smtp_password: str | None = None
    # Display name on outgoing mail. Gmail rewrites the address to the
    # authenticated account, so only the name is really ours to choose.
    smtp_from_name: str = "Creditxora"
    smtp_from_email: str | None = None
    smtp_timeout_seconds: int = 20

    @property
    def smtp_enabled(self) -> bool:
        return bool(self.smtp_host and self.smtp_user and self.smtp_password)

    @property
    def mail_from(self) -> str:
        address = self.smtp_from_email or self.smtp_user or "no-reply@creditxora.com"
        return f"{self.smtp_from_name} <{address}>"

    # --- Bootstrap ---------------------------------------------------------
    seed_demo_data: bool = True
    bootstrap_admin_email: str = "admin@creditxora.com"
    bootstrap_admin_password: str = "Creditxora!Admin1"

    @field_validator("cors_origins", "allowed_upload_types", mode="before")
    @classmethod
    def _split_csv(cls, value: object) -> object:
        if isinstance(value, str):
            return [item.strip() for item in value.split(",") if item.strip()]
        return value

    @property
    def is_production(self) -> bool:
        return self.environment.lower() in {"production", "prod"}


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
