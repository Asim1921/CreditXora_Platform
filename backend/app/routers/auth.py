"""Authentication: sign in, refresh, profile, password change."""

from __future__ import annotations

import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.config import settings
from app.core.deps import get_current_user, get_db
from app.core.security import (
    TokenType,
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.common import to_object_id, utcnow
from app.models.user import (
    AuthenticatedUser,
    ChangePasswordRequest,
    LoginRequest,
    RefreshRequest,
    TokenPair,
    UserPublic,
)

router = APIRouter(prefix="/auth", tags=["auth"])

INVALID_CREDENTIALS = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="That email and password combination doesn't match our records.",
)


def _public_user(record: dict) -> UserPublic:
    return UserPublic(
        id=str(record["_id"]),
        email=record["email"],
        first_name=record.get("first_name", ""),
        last_name=record.get("last_name", ""),
        role=record.get("role", "client"),
        must_change_password=record.get("must_change_password", False),
        created_at=record.get("created_at"),
        last_login_at=record.get("last_login_at"),
    )


def _issue_tokens(record: dict) -> TokenPair:
    user_id = str(record["_id"])
    role = record.get("role", "client")
    return TokenPair(
        access_token=create_access_token(user_id, role),
        refresh_token=create_refresh_token(user_id, role),
        expires_in=settings.access_token_ttl_minutes * 60,
        user=_public_user(record),
    )


@router.post("/login", response_model=TokenPair)
async def login(
    payload: LoginRequest,
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> TokenPair:
    record = await db.users.find_one({"email": payload.email.lower()})
    # Compare against a dummy hash when the user is absent so the response time
    # doesn't reveal whether an account exists.
    stored_hash = record.get("password_hash", "") if record else ""
    if not verify_password(payload.password, stored_hash) or not record:
        raise INVALID_CREDENTIALS
    if not record.get("active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account is not active. Please contact Creditxora.",
        )

    await db.users.update_one({"_id": record["_id"]}, {"$set": {"last_login_at": utcnow()}})
    return _issue_tokens(record)


@router.post("/refresh", response_model=TokenPair)
async def refresh(
    payload: RefreshRequest,
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> TokenPair:
    try:
        claims = decode_token(payload.refresh_token, TokenType.REFRESH)
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Your session has expired. Please sign in again.",
        ) from None

    oid = to_object_id(claims["sub"])
    record = await db.users.find_one({"_id": oid, "active": True}) if oid else None
    if record is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Your session has expired. Please sign in again.",
        )
    return _issue_tokens(record)


@router.get("/me", response_model=UserPublic)
async def me(
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> UserPublic:
    record = await db.users.find_one({"_id": to_object_id(user.id)})
    if record is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    return _public_user(record)


@router.post("/change-password", status_code=status.HTTP_204_NO_CONTENT)
async def change_password(
    payload: ChangePasswordRequest,
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> None:
    record = await db.users.find_one({"_id": to_object_id(user.id)})
    if record is None or not verify_password(payload.current_password, record["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your current password is incorrect.",
        )
    if verify_password(payload.new_password, record["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Choose a password you haven't used before.",
        )
    await db.users.update_one(
        {"_id": record["_id"]},
        {
            "$set": {
                "password_hash": hash_password(payload.new_password),
                "must_change_password": False,
                "password_changed_at": utcnow(),
            }
        },
    )
