"""Authentication and user schemas."""

from __future__ import annotations

import re
from datetime import datetime
from enum import StrEnum

from pydantic import EmailStr, Field, field_validator, model_validator

from app.models.common import ApiModel, UserRole
from app.models.lead import US_STATES

_ZIP_RE = re.compile(r"^\d{5}(-\d{4})?$")
_PHONE_DIGITS_RE = re.compile(r"\D")


def check_password_strength(value: str) -> str:
    """Shared rule for every place a user chooses their own password."""
    if value.isalpha() or value.isdigit():
        raise ValueError("Use a mix of letters, numbers or symbols.")
    # bcrypt silently truncates past 72 bytes, so reject rather than accept a
    # password whose tail would be ignored at sign-in.
    if len(value.encode("utf-8")) > 72:
        raise ValueError("Password must be 72 bytes or fewer.")
    return value


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
        return check_password_strength(value)


class SignupRole(StrEnum):
    """Roles a visitor may register for. Admin is deliberately absent."""

    CLIENT = "client"
    SPECIALIST = "specialist"


class SignupRequest(ApiModel):
    """Self-service registration from the public sign-up page."""

    role: SignupRole = SignupRole.CLIENT
    first_name: str = Field(min_length=1, max_length=60)
    last_name: str = Field(min_length=1, max_length=60)
    email: EmailStr
    password: str = Field(min_length=10, max_length=72)
    accept_terms: bool = False

    # Client-only contact details, carried onto the client file.
    phone: str | None = Field(default=None, max_length=25)
    state: str | None = Field(default=None, max_length=2)
    zip_code: str | None = Field(default=None, max_length=10)

    @field_validator("password")
    @classmethod
    def _strength(cls, value: str) -> str:
        return check_password_strength(value)

    @field_validator("accept_terms")
    @classmethod
    def _must_accept(cls, value: bool) -> bool:
        if not value:
            raise ValueError("You must accept the terms and privacy policy to create an account.")
        return value

    @field_validator("phone", "state", "zip_code", mode="before")
    @classmethod
    def _blank_to_none(cls, value: object) -> object:
        if isinstance(value, str) and not value.strip():
            return None
        return value

    @field_validator("state")
    @classmethod
    def _valid_state(cls, value: str | None) -> str | None:
        if value is None:
            return None
        code = value.upper()
        if code not in US_STATES:
            raise ValueError("Enter a valid U.S. state.")
        return code

    @field_validator("zip_code")
    @classmethod
    def _valid_zip(cls, value: str | None) -> str | None:
        if value is not None and not _ZIP_RE.match(value):
            raise ValueError("Enter a valid 5-digit ZIP code.")
        return value

    @field_validator("phone")
    @classmethod
    def _valid_phone(cls, value: str | None) -> str | None:
        if value is None:
            return None
        digits = _PHONE_DIGITS_RE.sub("", value)
        if len(digits) == 11 and digits.startswith("1"):
            digits = digits[1:]
        if len(digits) != 10:
            raise ValueError("Enter a valid 10-digit U.S. phone number.")
        return f"({digits[0:3]}) {digits[3:6]}-{digits[6:]}"

    @model_validator(mode="after")
    def _client_contact_details(self) -> SignupRequest:
        # A client file feeds the CRM, so phone and state aren't optional there.
        if self.role == SignupRole.CLIENT:
            if not self.phone:
                raise ValueError("phone: A contact phone number is required.")
            if not self.state:
                raise ValueError("state: Select the state you live in.")
        return self


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


class SignupResponse(ApiModel):
    """`session` is present only when the new account can sign in right away."""

    status: str  # "active" | "pending_approval"
    message: str
    session: TokenPair | None = None


class StaffMember(ApiModel):
    """Row shape for the admin staff directory."""

    id: str
    email: EmailStr
    first_name: str
    last_name: str
    role: UserRole
    active: bool = True
    self_registered: bool = False
    # Distinguishes a request still awaiting a decision from an account that was
    # approved and later deactivated — only the former can be declined.
    approved_at: datetime | None = None
    created_at: datetime | None = None
    last_login_at: datetime | None = None


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
