"""Authentication: sign up, sign in, refresh, profile, password change."""

from __future__ import annotations

from datetime import datetime, timedelta

import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo.errors import DuplicateKeyError

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
from app.models.common import (
    ActivityType,
    ClientStatus,
    JourneyPhase,
    TaskStatus,
    UserRole,
    new_reference,
    to_object_id,
    utcnow,
)
from app.models.user import (
    AuthenticatedUser,
    ChangePasswordRequest,
    LoginRequest,
    RefreshRequest,
    SignupRequest,
    SignupResponse,
    SignupRole,
    TokenPair,
    UserPublic,
)
from app.services.activity import log_activity
from app.services.notifications import notify, notify_client

router = APIRouter(prefix="/auth", tags=["auth"])

INVALID_CREDENTIALS = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="That email and password combination doesn't match our records.",
)

EMAIL_TAKEN = HTTPException(
    status_code=status.HTTP_409_CONFLICT,
    detail="An account already exists for that email address. Try signing in instead.",
)

PENDING_APPROVAL_MESSAGE = (
    "Your specialist account has been created and is awaiting approval. A Creditxora "
    "administrator reviews every staff request — you'll be able to sign in once your "
    "account is approved."
)

CLIENT_WELCOME_MESSAGE = (
    "Your Creditxora account is ready. Upload your credit reports to start your review."
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


async def _open_client_file(
    db: AsyncIOMotorDatabase,
    *,
    user_id: str,
    payload: SignupRequest,
    email: str,
    now: datetime,
) -> str:
    """Create the client record (and onboarding checklist) a portal login needs."""
    full_name = f"{payload.first_name} {payload.last_name}".strip()
    reference = new_reference("CXC")

    client_result = await db.clients.insert_one(
        {
            "user_id": user_id,
            "lead_id": None,
            "reference": reference,
            "first_name": payload.first_name,
            "last_name": payload.last_name,
            "email": email,
            "phone": payload.phone or "",
            "state": payload.state or "",
            "zip_code": payload.zip_code,
            "package": "Credit Profile Review",
            "status": ClientStatus.PENDING_DOCUMENTS.value,
            "current_phase": JourneyPhase.ASSESSMENT.value,
            "phase_history": {JourneyPhase.ASSESSMENT.value: now},
            # Unassigned until an admin picks it up from the Clients board.
            "assigned_specialist_id": None,
            "start_date": now,
            "next_follow_up_at": now + timedelta(days=3),
            "goals": [],
            "concerns": [],
            "payment_status": "unpaid",
            "internal_notes": [],
            "source": "self_signup",
            "created_at": now,
            "updated_at": now,
        }
    )
    client_id = str(client_result.inserted_id)

    await db.tasks.insert_many(
        [
            {
                "client_id": client_id,
                "title": "Upload your three credit reports",
                "description": (
                    "Add your Experian, Equifax and TransUnion reports so a "
                    "specialist can begin your review."
                ),
                "status": TaskStatus.OPEN.value,
                "owner": "client",
                "due_at": now + timedelta(days=5),
                "created_at": now,
            },
            {
                "client_id": client_id,
                "title": "Confirm your personal information",
                "description": "Check that your name, address and phone number are current.",
                "status": TaskStatus.OPEN.value,
                "owner": "client",
                "due_at": now + timedelta(days=5),
                "created_at": now,
            },
        ]
    )

    await log_activity(
        db,
        subject_id=client_id,
        subject_type="client",
        activity_type=ActivityType.CLIENT_CONVERTED,
        summary=f"Client file opened from a self-service sign-up ({reference}).",
        actor_name=full_name,
        actor_id=user_id,
    )
    await notify(
        db,
        recipient="admin",
        title="New client registration",
        body=(
            f"{full_name} created a Creditxora account from the website.\n\n"
            f"Reference: {reference}\nEmail: {email}\n"
            f"Phone: {payload.phone or '—'}\nState: {payload.state or '—'}\n\n"
            "The file is unassigned — assign a specialist from the Clients board."
        ),
        kind="client",
        link=f"/admin/clients/{client_id}",
        email_to=settings.admin_notification_email,
        reply_to=email,
    )
    await notify_client(
        db,
        user_id=user_id,
        title="Welcome to your Creditxora portal",
        body=(
            f"Hi {payload.first_name},\n\n"
            "Your portal is ready. Start by uploading your credit reports so a "
            "specialist can begin reviewing your file for potential inaccuracies.\n\n"
            "Creditxora does not guarantee specific credit-score increases, deletions, "
            "approvals, or outcomes. Results vary by individual circumstances."
        ),
        kind="onboarding",
        link="/portal",
        email_to=email,
    )
    return client_id


@router.post(
    "/signup",
    response_model=SignupResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a client or specialist account",
)
async def signup(
    payload: SignupRequest,
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> SignupResponse:
    email = payload.email.lower()
    now = utcnow()
    is_client = payload.role == SignupRole.CLIENT

    if await db.users.find_one({"email": email}, {"_id": 1}):
        raise EMAIL_TAKEN

    document = {
        "email": email,
        "first_name": payload.first_name,
        "last_name": payload.last_name,
        "password_hash": hash_password(payload.password),
        # ApiModel sets use_enum_values, so payload.role is already the raw
        # string; round-tripping it through UserRole keeps the stored value
        # aligned with every other user record.
        "role": UserRole(payload.role).value,
        # A specialist account reaches every client file, so a self-registered
        # one stays inert until an administrator approves it. The auth
        # dependency and /auth/login both refuse an inactive account.
        "active": is_client,
        "must_change_password": False,
        "self_registered": True,
        "created_at": now,
        "last_login_at": None,
    }
    try:
        result = await db.users.insert_one(document)
    except DuplicateKeyError:
        # Lost a race against a concurrent signup for the same address.
        raise EMAIL_TAKEN from None

    document["_id"] = result.inserted_id
    user_id = str(result.inserted_id)
    full_name = f"{payload.first_name} {payload.last_name}".strip()

    if not is_client:
        await notify(
            db,
            recipient="admin",
            title="Specialist account awaiting approval",
            body=(
                f"{full_name} requested a Creditxora specialist account.\n\n"
                f"Email: {email}\n\n"
                "The account cannot sign in until you approve it under Admin → Staff. "
                "Only approve people you recognise — specialists can see every client "
                "file, document and dispute."
            ),
            kind="staff",
            link="/admin/staff",
            email_to=settings.admin_notification_email,
            reply_to=email,
        )
        return SignupResponse(status="pending_approval", message=PENDING_APPROVAL_MESSAGE)

    await _open_client_file(db, user_id=user_id, payload=payload, email=email, now=now)

    return SignupResponse(
        status="active",
        message=CLIENT_WELCOME_MESSAGE,
        session=_issue_tokens(document),
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
        # A self-registered specialist hasn't been rejected — they're queued.
        awaiting_approval = (
            record.get("self_registered")
            and record.get("role") == UserRole.SPECIALIST.value
            and record.get("approved_at") is None
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                PENDING_APPROVAL_MESSAGE
                if awaiting_approval
                else "This account is not active. Please contact Creditxora."
            ),
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
