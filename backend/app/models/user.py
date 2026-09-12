"""Authentication and user schemas."""

from __future__ import annotations

from datetime import datetime

from pydantic import EmailStr, Field, field_validator

from app.models.common import ApiModel, UserRole


class LoginRequest(ApiModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=200)


class RefreshRequest(ApiModel):
    refresh_token: str


class ChangePasswordRequest(ApiModel):
    current_password: str = Field(min_length=1, max_length=200)
    new_password: str = Field(min_length=10, max_length=72)

    @field_validator("new_password")
    @classmethod
    def _strength(cls, value: str) -> str:
        if value.isalpha() or value.isdigit():
            raise ValueError("Use a mix of letters, numbers or symbols.")
        if len(value.encode("utf-8")) > 72:
            raise ValueError("Password must be 72 bytes or fewer.")
        return value


class UserPublic(ApiModel):
    id: str
    email: EmailStr
    first_name: str
    last_name: str
    role: UserRole
    must_change_password: bool = False
    created_at: datetime | None = None
    last_login_at: datetime | None = None

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}".strip()


class TokenPair(ApiModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserPublic


class AuthenticatedUser(ApiModel):
    """Attached to the request by the auth dependency."""

    id: str
    email: str
    first_name: str
    last_name: str
    role: UserRole
    must_change_password: bool = False

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}".strip()

    @property
    def is_staff(self) -> bool:
        return self.role in (UserRole.ADMIN, UserRole.SPECIALIST)
