"""Password hashing, JWT issuing/verification, and at-rest file encryption."""

from __future__ import annotations

import secrets
from datetime import datetime, timedelta, timezone
from enum import StrEnum
from pathlib import Path

import bcrypt
import jwt
from cryptography.fernet import Fernet

from app.core.config import settings

# --- Passwords -------------------------------------------------------------

# bcrypt truncates silently past 72 bytes; reject rather than accept a password
# whose tail is ignored.
MAX_PASSWORD_BYTES = 72


def hash_password(password: str) -> str:
    encoded = password.encode("utf-8")
    if len(encoded) > MAX_PASSWORD_BYTES:
        raise ValueError("Password must be 72 bytes or fewer.")
    return bcrypt.hashpw(encoded, bcrypt.gensalt(rounds=12)).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except (ValueError, TypeError):
        return False


def generate_temp_password(length: int = 14) -> str:
    """Readable one-time password handed to a client when their portal opens."""
    alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789"
    return "".join(secrets.choice(alphabet) for _ in range(length))


# --- Tokens ----------------------------------------------------------------


class TokenType(StrEnum):
    ACCESS = "access"
    REFRESH = "refresh"


def _create_token(subject: str, role: str, token_type: TokenType, ttl: timedelta) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": subject,
        "role": role,
        "type": token_type.value,
        "iat": int(now.timestamp()),
        "exp": int((now + ttl).timestamp()),
        "jti": secrets.token_urlsafe(16),
    }
    return jwt.encode(payload, settings.secret_key, algorithm=settings.jwt_algorithm)


def create_access_token(subject: str, role: str) -> str:
    return _create_token(
        subject,
        role,
        TokenType.ACCESS,
        timedelta(minutes=settings.access_token_ttl_minutes),
    )


def create_refresh_token(subject: str, role: str) -> str:
    return _create_token(
        subject,
        role,
        TokenType.REFRESH,
        timedelta(days=settings.refresh_token_ttl_days),
    )


def decode_token(token: str, expected_type: TokenType) -> dict:
    """Return the token claims, or raise jwt.InvalidTokenError."""
    claims = jwt.decode(
        token,
        settings.secret_key,
        algorithms=[settings.jwt_algorithm],
        options={"require": ["exp", "sub", "type"]},
    )
    if claims.get("type") != expected_type.value:
        raise jwt.InvalidTokenError(f"Expected a {expected_type.value} token.")
    return claims


# --- Document encryption ---------------------------------------------------

_KEY_FILE = Path(settings.upload_dir).parent / ".storage_key"


def _load_or_create_key() -> bytes:
    if settings.storage_encryption_key:
        return settings.storage_encryption_key.encode("utf-8")
    if _KEY_FILE.exists():
        return _KEY_FILE.read_bytes().strip()
    _KEY_FILE.parent.mkdir(parents=True, exist_ok=True)
    key = Fernet.generate_key()
    _KEY_FILE.write_bytes(key)
    return key


_fernet: Fernet | None = None


def _cipher() -> Fernet:
    global _fernet
    if _fernet is None:
        _fernet = Fernet(_load_or_create_key())
    return _fernet


def encrypt_bytes(raw: bytes) -> bytes:
    return _cipher().encrypt(raw)


def decrypt_bytes(blob: bytes) -> bytes:
    return _cipher().decrypt(blob)
