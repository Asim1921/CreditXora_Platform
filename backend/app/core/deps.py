"""Reusable FastAPI dependencies: authentication and role gates."""

from __future__ import annotations

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.security import TokenType, decode_token
from app.db.mongo import get_database
from app.models.common import UserRole, to_object_id
from app.models.user import AuthenticatedUser

bearer_scheme = HTTPBearer(auto_error=False, description="Creditxora access token")

CREDENTIALS_ERROR = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Not authenticated.",
    headers={"WWW-Authenticate": "Bearer"},
)


def get_db() -> AsyncIOMotorDatabase:
    return get_database()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> AuthenticatedUser:
    if credentials is None or not credentials.credentials:
        raise CREDENTIALS_ERROR
    try:
        claims = decode_token(credentials.credentials, TokenType.ACCESS)
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Your session has expired. Please sign in again.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from None
    except jwt.InvalidTokenError:
        raise CREDENTIALS_ERROR from None

    oid = to_object_id(claims["sub"])
    if oid is None:
        raise CREDENTIALS_ERROR
    record = await db.users.find_one({"_id": oid, "active": True})
    if record is None:
        raise CREDENTIALS_ERROR

    return AuthenticatedUser(
        id=str(record["_id"]),
        email=record["email"],
        first_name=record.get("first_name", ""),
        last_name=record.get("last_name", ""),
        role=record.get("role", UserRole.CLIENT),
        must_change_password=record.get("must_change_password", False),
    )


async def require_client(
    user: AuthenticatedUser = Depends(get_current_user),
) -> AuthenticatedUser:
    if user.role != UserRole.CLIENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This area is for Creditxora clients.",
        )
    return user


async def require_staff(
    user: AuthenticatedUser = Depends(get_current_user),
) -> AuthenticatedUser:
    if not user.is_staff:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Staff access required.",
        )
    return user


async def require_admin(
    user: AuthenticatedUser = Depends(get_current_user),
) -> AuthenticatedUser:
    if user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator access required.",
        )
    return user
