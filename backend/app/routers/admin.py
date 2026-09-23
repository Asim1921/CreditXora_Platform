"""Admin dashboard API: lead pipeline, client management, CRM detail."""

from __future__ import annotations

from datetime import timedelta
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.deps import get_db, require_admin, require_staff
from app.core.security import generate_temp_password, hash_password
from app.models.client import (
    ClientNoteCreate,
    ClientSummary,
    ClientUpdate,
    DisputeCreate,
    DisputeItem,
    DisputeUpdate,
    MessageCreate,
    TaskCreate,
)
from app.models.common import (
    BUREAU_LABELS,
    CLIENT_STATUS_LABELS,
    DISPUTE_STAGE_LABELS,
    JOURNEY_PHASE_LABELS,
    LEAD_STATUS_LABELS,
    ActivityType,
    ClientStatus,
    JourneyPhase,
    LeadStatus,
    TaskStatus,
    UserRole,
    new_reference,
    serialize,
    to_object_id,
    utcnow,
)
from app.models.lead import (
    LEAD_DETAIL_FIELDS,
    LEAD_REQUIRED_FIELDS,
    LeadConvertRequest,
    LeadConvertResponse,
    LeadDetail,
    LeadNoteCreate,
    LeadSummary,
    LeadUpdate,
)
from app.models.user import AuthenticatedUser, StaffMember
from app.services.activity import list_activity, log_activity
from app.services.clients import build_bureau_status, build_client_profile, build_journey
from app.services.notifications import notify, notify_client

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_staff)])


# --- helpers ---------------------------------------------------------------


async def _specialist_names(db: AsyncIOMotorDatabase, ids: set[str]) -> dict[str, str]:
    oids = [oid for oid in (to_object_id(i) for i in ids if i) if oid]
    if not oids:
        return {}
    cursor = db.users.find({"_id": {"$in": oids}}, {"first_name": 1, "last_name": 1})
    return {
        str(doc["_id"]): f"{doc.get('first_name', '')} {doc.get('last_name', '')}".strip()
        async for doc in cursor
    }


def _lead_summary(doc: dict, names: dict[str, str]) -> LeadSummary:
    assigned = doc.get("assigned_to")
    return LeadSummary(
        id=str(doc["_id"]),
        reference=doc.get("reference", ""),
        first_name=doc.get("first_name", ""),
        last_name=doc.get("last_name", ""),
        email=doc.get("email", ""),
        phone=doc.get("phone", ""),
        state=doc.get("state", ""),
        status=doc.get("status", LeadStatus.NEW.value),
        concerns=doc.get("concerns", []),
        goals=doc.get("goals", []),
        tags=doc.get("tags", []),
        assigned_to=assigned,
        assigned_to_name=names.get(assigned) if assigned else None,
        next_follow_up_at=doc.get("next_follow_up_at"),
        created_at=doc["created_at"],
        updated_at=doc.get("updated_at", doc["created_at"]),
        converted_client_id=doc.get("converted_client_id"),
    )


def _changed(new: Any, old: Any) -> bool:
    """Whether a submitted answer differs from the stored one. Multi-select
    answers are compared as sets, so re-ticking the same boxes in a different
    order isn't logged as a correction."""
    if isinstance(new, list) or isinstance(old, list):
        return sorted(new or []) != sorted(old or [])
    return new != old


# --- overview --------------------------------------------------------------


@router.get("/overview")
async def overview(db: AsyncIOMotorDatabase = Depends(get_db)) -> dict[str, Any]:
    """Counts for the admin landing page, in the spec's pipeline order."""
    lead_counts = {status_value: 0 for status_value in LEAD_STATUS_LABELS}
    async for row in db.leads.aggregate([{"$group": {"_id": "$status", "n": {"$sum": 1}}}]):
        if row["_id"] in lead_counts:
            lead_counts[row["_id"]] = row["n"]

    client_counts = {status_value: 0 for status_value in CLIENT_STATUS_LABELS}
    async for row in db.clients.aggregate([{"$group": {"_id": "$status", "n": {"$sum": 1}}}]):
        if row["_id"] in client_counts:
            client_counts[row["_id"]] = row["n"]

    now = utcnow()
    week_ago = now - timedelta(days=7)

    total_leads = sum(lead_counts.values())
    converted = lead_counts.get(LeadStatus.CONVERTED.value, 0)

    return {
        "leads": [
            {"key": key, "label": LEAD_STATUS_LABELS[key], "count": lead_counts[key]}
            for key in LEAD_STATUS_LABELS
        ],
        "clients": [
            {"key": key, "label": CLIENT_STATUS_LABELS[key], "count": client_counts[key]}
            for key in CLIENT_STATUS_LABELS
        ],
        "totals": {
            "leads": total_leads,
            "clients": sum(client_counts.values()),
            "new_leads_this_week": await db.leads.count_documents(
                {"created_at": {"$gte": week_ago}}
            ),
            "documents_awaiting_review": await db.documents.count_documents(
                {"status": "received"}
            ),
            "follow_ups_due": await db.clients.count_documents(
                {"next_follow_up_at": {"$lte": now}}
            )
            + await db.leads.count_documents({"next_follow_up_at": {"$lte": now}}),
            "unread_notifications": await db.notifications.count_documents(
                {"recipient": "admin", "read": False}
            ),
            "conversion_rate": round((converted / total_leads) * 100) if total_leads else 0,
        },
        "recent_activity": await list_activity(
            db,
            [
                str(doc["_id"])
                async for doc in db.leads.find({}, {"_id": 1}).sort("updated_at", -1).limit(40)
            ]
            + [
                str(doc["_id"])
                async for doc in db.clients.find({}, {"_id": 1}).sort("updated_at", -1).limit(40)
            ],
            limit=12,
        ),
    }


# --- leads -----------------------------------------------------------------


@router.get("/leads", response_model=list[LeadSummary])
async def list_leads(
    status_filter: LeadStatus | None = Query(default=None, alias="status"),
    search: str | None = Query(default=None, max_length=120),
    assigned_to: str | None = None,
    limit: int = Query(default=100, ge=1, le=500),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> list[LeadSummary]:
    query: dict[str, Any] = {}
    if status_filter:
        query["status"] = status_filter.value
    if assigned_to:
        query["assigned_to"] = assigned_to
    if search:
        # Regex rather than $text so partial matches work while typing.
        pattern = {"$regex": search.strip(), "$options": "i"}
        query["$or"] = [
            {"first_name": pattern},
            {"last_name": pattern},
            {"email": pattern},
            {"phone": pattern},
            {"reference": pattern},
        ]

    docs = [doc async for doc in db.leads.find(query).sort("created_at", -1).limit(limit)]
    names = await _specialist_names(db, {d.get("assigned_to") for d in docs if d.get("assigned_to")})
    return [_lead_summary(doc, names) for doc in docs]


@router.get("/leads/{lead_id}", response_model=LeadDetail)
async def get_lead(
    lead_id: str, db: AsyncIOMotorDatabase = Depends(get_db)
) -> LeadDetail:
    oid = to_object_id(lead_id)
    doc = await db.leads.find_one({"_id": oid}) if oid else None
    if doc is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found.")
    names = await _specialist_names(db, {doc.get("assigned_to")})
    summary = _lead_summary(doc, names)
    return LeadDetail(
        **summary.model_dump(),
        zip_code=doc.get("zip_code", ""),
        score_range=doc.get("score_range"),
        bureaus=doc.get("bureaus", []),
        negative_accounts=doc.get("negative_accounts"),
        has_recent_report=doc.get("has_recent_report"),
        notes=doc.get("notes"),
        source=doc.get("source"),
        consent_contact=doc.get("consent_contact", False),
        internal_notes=doc.get("internal_notes", []),
    )


@router.get("/leads/{lead_id}/activity")
async def lead_activity(
    lead_id: str, db: AsyncIOMotorDatabase = Depends(get_db)
) -> list[dict]:
    return await list_activity(db, [lead_id])


@router.patch("/leads/{lead_id}", response_model=LeadSummary)
async def update_lead(
    lead_id: str,
    payload: LeadUpdate,
    user: AuthenticatedUser = Depends(require_staff),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> LeadSummary:
    oid = to_object_id(lead_id)
    existing = await db.leads.find_one({"_id": oid}) if oid else None
    if existing is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found.")

    updates = payload.model_dump(exclude_unset=True)
    # A null for an answer the pipeline relies on is a no-op, not a wipe.
    updates = {
        field: value
        for field, value in updates.items()
        if value is not None or field not in LEAD_REQUIRED_FIELDS
    }
    if not updates:
        names = await _specialist_names(db, {existing.get("assigned_to")})
        return _lead_summary(existing, names)
    updates["updated_at"] = utcnow()

    await db.leads.update_one({"_id": oid}, {"$set": updates})

    if "status" in updates and updates["status"] != existing.get("status"):
        await log_activity(
            db,
            subject_id=lead_id,
            subject_type="lead",
            activity_type=ActivityType.STATUS_CHANGED,
            summary=(
                f"Status changed from {LEAD_STATUS_LABELS.get(existing.get('status'), '—')} "
                f"to {LEAD_STATUS_LABELS.get(updates['status'], updates['status'])}."
            ),
            actor_name=user.full_name,
            actor_id=user.id,
        )
    if "assigned_to" in updates and updates["assigned_to"] != existing.get("assigned_to"):
        names = await _specialist_names(db, {updates["assigned_to"]})
        await log_activity(
            db,
            subject_id=lead_id,
            subject_type="lead",
            activity_type=ActivityType.ASSIGNMENT_CHANGED,
            summary=f"Assigned to {names.get(updates['assigned_to'], 'unassigned')}.",
            actor_name=user.full_name,
            actor_id=user.id,
        )

    corrected = [
        label
        for field, label in LEAD_DETAIL_FIELDS.items()
        if field in updates and _changed(updates[field], existing.get(field))
    ]
    if corrected:
        await log_activity(
            db,
            subject_id=lead_id,
            subject_type="lead",
            activity_type=ActivityType.NOTE_ADDED,
            summary=f"Assessment answers corrected: {', '.join(corrected)}.",
            actor_name=user.full_name,
            actor_id=user.id,
        )

    updated = await db.leads.find_one({"_id": oid})
    names = await _specialist_names(db, {updated.get("assigned_to")})
    return _lead_summary(updated, names)


@router.delete("/leads/{lead_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lead(
    lead_id: str,
    user: AuthenticatedUser = Depends(require_admin),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> None:
    """Remove a lead that should never have entered the pipeline — a duplicate,
    a test entry or spam. A converted lead is kept, because its client file
    still refers back to it; close the client record instead."""
    oid = to_object_id(lead_id)
    doc = await db.leads.find_one({"_id": oid}) if oid else None
    if doc is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found.")
    if doc.get("converted_client_id"):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "This lead has been converted to a client, so it can't be deleted. "
                "Work from the client file instead."
            ),
        )

    name = f"{doc.get('first_name', '')} {doc.get('last_name', '')}".strip()
    await db.leads.delete_one({"_id": oid})
    await db.activities.delete_many({"subject_id": lead_id, "subject_type": "lead"})
    # Written after the lead's own history is cleared, so the deletion itself
    # survives as an audit record.
    await log_activity(
        db,
        subject_id=lead_id,
        subject_type="lead_deleted",
        activity_type=ActivityType.STATUS_CHANGED,
        summary=f"Lead deleted: {name or doc.get('email', lead_id)} ({doc.get('reference', '—')}).",
        actor_name=user.full_name,
        actor_id=user.id,
    )


@router.post("/leads/{lead_id}/notes", status_code=status.HTTP_201_CREATED)
async def add_lead_note(
    lead_id: str,
    payload: LeadNoteCreate,
    user: AuthenticatedUser = Depends(require_staff),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> dict[str, str]:
    oid = to_object_id(lead_id)
    if oid is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found.")
    note = {"body": payload.body, "author": user.full_name, "created_at": utcnow()}
    result = await db.leads.update_one(
        {"_id": oid}, {"$push": {"internal_notes": note}, "$set": {"updated_at": utcnow()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found.")
    await log_activity(
        db,
        subject_id=lead_id,
        subject_type="lead",
        activity_type=ActivityType.NOTE_ADDED,
        summary=payload.body[:180],
        actor_name=user.full_name,
        actor_id=user.id,
    )
    return {"message": "Note added."}


@router.post("/leads/{lead_id}/convert", response_model=LeadConvertResponse)
async def convert_lead(
    lead_id: str,
    payload: LeadConvertRequest,
    user: AuthenticatedUser = Depends(require_staff),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> LeadConvertResponse:
    """Turn a lead into a client with a portal login."""
    oid = to_object_id(lead_id)
    lead = await db.leads.find_one({"_id": oid}) if oid else None
    if lead is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found.")
    if lead.get("converted_client_id"):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This lead has already been converted to a client.",
        )

    email = lead["email"].lower()
    now = utcnow()
    temp_password: str | None = None

    existing_user = await db.users.find_one({"email": email})
    if existing_user:
        user_id = str(existing_user["_id"])
        if await db.clients.find_one({"user_id": user_id}):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A client file already exists for this email address.",
            )
    else:
        temp_password = generate_temp_password()
        user_result = await db.users.insert_one(
            {
                "email": email,
                "first_name": lead["first_name"],
                "last_name": lead["last_name"],
                "password_hash": hash_password(temp_password),
                "role": UserRole.CLIENT.value,
                "active": True,
                "must_change_password": True,
                "created_at": now,
                "last_login_at": None,
            }
        )
        user_id = str(user_result.inserted_id)

    client_result = await db.clients.insert_one(
        {
            "user_id": user_id,
            "lead_id": lead_id,
            "reference": new_reference("CXC"),
            "first_name": lead["first_name"],
            "last_name": lead["last_name"],
            "email": email,
            "phone": lead.get("phone", ""),
            "state": lead.get("state", ""),
            "zip_code": lead.get("zip_code"),
            "package": payload.package,
            "status": ClientStatus.PENDING_DOCUMENTS.value,
            "current_phase": JourneyPhase.REVIEW.value,
            "phase_history": {JourneyPhase.ASSESSMENT.value: now},
            "assigned_specialist_id": payload.assigned_specialist_id or user.id,
            "start_date": now,
            "next_follow_up_at": now + timedelta(days=3),
            "goals": lead.get("goals", []),
            "concerns": lead.get("concerns", []),
            "payment_status": "unpaid",
            "internal_notes": [],
            "created_at": now,
            "updated_at": now,
        }
    )
    client_id = str(client_result.inserted_id)

    await db.leads.update_one(
        {"_id": oid},
        {
            "$set": {
                "status": LeadStatus.CONVERTED.value,
                "converted_client_id": client_id,
                "updated_at": now,
            }
        },
    )

    # Seed the onboarding checklist so the portal isn't empty on first login.
    await db.tasks.insert_many(
        [
            {
                "client_id": client_id,
                "title": "Upload your three credit reports",
                "description": (
                    "Add your Experian, Equifax and TransUnion reports so your "
                    "specialist can begin the review."
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
        subject_id=lead_id,
        subject_type="lead",
        activity_type=ActivityType.CLIENT_CONVERTED,
        summary=f"Converted to client — {payload.package}.",
        actor_name=user.full_name,
        actor_id=user.id,
    )
    await log_activity(
        db,
        subject_id=client_id,
        subject_type="client",
        activity_type=ActivityType.CLIENT_CONVERTED,
        summary=f"Client file opened from lead {lead.get('reference', '')}.",
        actor_name=user.full_name,
        actor_id=user.id,
    )

    if payload.send_welcome:
        await notify_client(
            db,
            user_id=user_id,
            title="Welcome to your Creditxora portal",
            body=(
                "Your client portal is ready. Start by uploading your credit reports "
                "so your specialist can begin the review."
            ),
            kind="onboarding",
            link="/portal",
            email_to=email,
        )

    return LeadConvertResponse(
        client_id=client_id,
        user_id=user_id,
        email=email,
        temporary_password=temp_password,
        message=(
            "Client file created. Share the temporary password securely — the client "
            "must change it at first sign-in."
            if temp_password
            else "Client file created for the existing account."
        ),
    )


# --- clients ---------------------------------------------------------------


@router.get("/clients", response_model=list[ClientSummary])
async def list_clients(
    status_filter: ClientStatus | None = Query(default=None, alias="status"),
    search: str | None = Query(default=None, max_length=120),
    limit: int = Query(default=100, ge=1, le=500),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> list[ClientSummary]:
    query: dict[str, Any] = {}
    if status_filter:
        query["status"] = status_filter.value
    if search:
        pattern = {"$regex": search.strip(), "$options": "i"}
        query["$or"] = [
            {"first_name": pattern},
            {"last_name": pattern},
            {"email": pattern},
            {"phone": pattern},
            {"reference": pattern},
        ]

    docs = [doc async for doc in db.clients.find(query).sort("start_date", -1).limit(limit)]
    names = await _specialist_names(
        db, {d.get("assigned_specialist_id") for d in docs if d.get("assigned_specialist_id")}
    )

    summaries: list[ClientSummary] = []
    for doc in docs:
        client_id = str(doc["_id"])
        client_status = doc.get("status", ClientStatus.ACTIVE.value)
        phase = doc.get("current_phase", JourneyPhase.ASSESSMENT.value)
        summaries.append(
            ClientSummary(
                id=client_id,
                reference=doc.get("reference", ""),
                first_name=doc.get("first_name", ""),
                last_name=doc.get("last_name", ""),
                email=doc.get("email", ""),
                phone=doc.get("phone", ""),
                state=doc.get("state", ""),
                package=doc.get("package", ""),
                status=client_status,
                status_label=CLIENT_STATUS_LABELS.get(client_status, client_status),
                current_phase=phase,
                phase_label=JOURNEY_PHASE_LABELS.get(phase, phase),
                assigned_specialist_name=names.get(doc.get("assigned_specialist_id")),
                start_date=doc.get("start_date"),
                next_follow_up_at=doc.get("next_follow_up_at"),
                documents_count=await db.documents.count_documents({"client_id": client_id}),
                payment_status=doc.get("payment_status", "unpaid"),
                open_tasks=await db.tasks.count_documents(
                    {"client_id": client_id, "status": {"$ne": TaskStatus.DONE.value}}
                ),
            )
        )
    return summaries


@router.get("/clients/{client_id}")
async def get_client(
    client_id: str, db: AsyncIOMotorDatabase = Depends(get_db)
) -> dict[str, Any]:
    """Everything the admin client-profile screen shows, in one call."""
    oid = to_object_id(client_id)
    doc = await db.clients.find_one({"_id": oid}) if oid else None
    if doc is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found.")

    profile = await build_client_profile(db, doc)
    documents = [
        serialize(d)
        async for d in db.documents.find(
            {"client_id": client_id}, {"storage_key": 0}
        ).sort("uploaded_at", -1)
    ]
    tasks = [serialize(t) async for t in db.tasks.find({"client_id": client_id}).sort("due_at", 1)]
    disputes = [
        {
            **serialize(d),
            "bureau_label": BUREAU_LABELS.get(d.get("bureau", ""), ""),
            "stage_label": DISPUTE_STAGE_LABELS.get(d.get("stage", ""), ""),
        }
        async for d in db.disputes.find({"client_id": client_id}).sort("opened_at", -1)
    ]
    messages = [
        serialize(m) async for m in db.messages.find({"thread_id": client_id}).sort("created_at", 1)
    ]
    payments = [
        serialize(p) async for p in db.payments.find({"client_id": client_id}).sort("due_at", -1)
    ]
    appointments = [
        serialize(a)
        async for a in db.appointments.find({"client_id": client_id}).sort("scheduled_for", 1)
    ]

    return {
        "profile": profile.model_dump(),
        "journey": [step.model_dump() for step in build_journey(
            doc.get("current_phase", "assessment"), doc.get("phase_history")
        )],
        "bureau_status": [b.model_dump() for b in await build_bureau_status(db, client_id)],
        "documents": documents,
        "tasks": tasks,
        "disputes": disputes,
        "messages": messages,
        "payments": payments,
        "appointments": appointments,
        "internal_notes": doc.get("internal_notes", []),
        "activity": await list_activity(db, [client_id, doc.get("lead_id", "")]),
        "payment_status": doc.get("payment_status", "unpaid"),
    }


@router.patch("/clients/{client_id}")
async def update_client(
    client_id: str,
    payload: ClientUpdate,
    user: AuthenticatedUser = Depends(require_staff),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> dict[str, str]:
    oid = to_object_id(client_id)
    existing = await db.clients.find_one({"_id": oid}) if oid else None
    if existing is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found.")

    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        return {"message": "Nothing to update."}
    updates["updated_at"] = utcnow()

    # Stamp the phase history so the portal can show when each stage finished.
    if "current_phase" in updates and updates["current_phase"] != existing.get("current_phase"):
        history = existing.get("phase_history", {})
        history[existing.get("current_phase", JourneyPhase.ASSESSMENT.value)] = utcnow()
        updates["phase_history"] = history

    await db.clients.update_one({"_id": oid}, {"$set": updates})

    if "status" in updates and updates["status"] != existing.get("status"):
        label = CLIENT_STATUS_LABELS.get(updates["status"], updates["status"])
        await log_activity(
            db,
            subject_id=client_id,
            subject_type="client",
            activity_type=ActivityType.STATUS_CHANGED,
            summary=f"Status changed to {label}.",
            actor_name=user.full_name,
            actor_id=user.id,
        )
        await notify_client(
            db,
            user_id=str(existing["user_id"]),
            title="Your file was updated",
            body=f"Your Creditxora file status is now: {label}.",
            kind="status",
            link="/portal",
        )

    if "current_phase" in updates and updates["current_phase"] != existing.get("current_phase"):
        label = JOURNEY_PHASE_LABELS.get(updates["current_phase"], updates["current_phase"])
        await log_activity(
            db,
            subject_id=client_id,
            subject_type="client",
            activity_type=ActivityType.PHASE_CHANGED,
            summary=f"Moved to the {label} phase.",
            actor_name=user.full_name,
            actor_id=user.id,
        )
        await notify_client(
            db,
            user_id=str(existing["user_id"]),
            title=f"You've moved to: {label}",
            body="Sign in to your portal to see what happens in this phase.",
            kind="phase",
            link="/portal",
        )

    return {"message": "Client updated."}


@router.post("/clients/{client_id}/notes", status_code=status.HTTP_201_CREATED)
async def add_client_note(
    client_id: str,
    payload: ClientNoteCreate,
    user: AuthenticatedUser = Depends(require_staff),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> dict[str, str]:
    oid = to_object_id(client_id)
    if oid is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found.")
    result = await db.clients.update_one(
        {"_id": oid},
        {
            "$push": {
                "internal_notes": {
                    "body": payload.body,
                    "author": user.full_name,
                    "created_at": utcnow(),
                }
            },
            "$set": {"updated_at": utcnow()},
        },
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found.")
    await log_activity(
        db,
        subject_id=client_id,
        subject_type="client",
        activity_type=ActivityType.NOTE_ADDED,
        summary=payload.body[:180],
        actor_name=user.full_name,
        actor_id=user.id,
    )
    return {"message": "Note added."}


@router.post("/clients/{client_id}/tasks", status_code=status.HTTP_201_CREATED)
async def create_task(
    client_id: str,
    payload: TaskCreate,
    user: AuthenticatedUser = Depends(require_staff),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> dict[str, str]:
    client = await db.clients.find_one({"_id": to_object_id(client_id) or ""})
    if client is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found.")
    await db.tasks.insert_one(
        {
            "client_id": client_id,
            "title": payload.title,
            "description": payload.description,
            "status": TaskStatus.OPEN.value,
            "owner": payload.owner,
            "due_at": payload.due_at,
            "created_at": utcnow(),
        }
    )
    if payload.owner == "client":
        await notify_client(
            db,
            user_id=str(client["user_id"]),
            title="New task on your file",
            body=payload.title,
            kind="task",
            link="/portal/tasks",
        )
    return {"message": "Task created."}


@router.post("/clients/{client_id}/messages", status_code=status.HTTP_201_CREATED)
async def send_client_message(
    client_id: str,
    payload: MessageCreate,
    user: AuthenticatedUser = Depends(require_staff),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> dict[str, str]:
    client = await db.clients.find_one({"_id": to_object_id(client_id) or ""})
    if client is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found.")
    await db.messages.insert_one(
        {
            "thread_id": client_id,
            "client_id": client_id,
            "body": payload.body,
            "author_name": user.full_name,
            "author_role": user.role,
            "read": False,
            "created_at": utcnow(),
        }
    )
    await notify_client(
        db,
        user_id=str(client["user_id"]),
        title="New message from your specialist",
        body=payload.body[:200],
        kind="message",
        link="/portal/messages",
    )
    return {"message": "Message sent."}


@router.post("/clients/{client_id}/disputes", response_model=DisputeItem, status_code=201)
async def create_dispute(
    client_id: str,
    payload: DisputeCreate,
    user: AuthenticatedUser = Depends(require_staff),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> DisputeItem:
    if await db.clients.find_one({"_id": to_object_id(client_id) or ""}) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found.")
    now = utcnow()
    document = {
        "client_id": client_id,
        "account_name": payload.account_name,
        "bureau": payload.bureau,
        "reason": payload.reason,
        "stage": payload.stage.value,
        "opened_at": now,
        "last_update_at": now,
        "outcome_note": None,
    }
    result = await db.disputes.insert_one(document)
    return DisputeItem(
        id=str(result.inserted_id),
        account_name=payload.account_name,
        bureau=payload.bureau,
        bureau_label=BUREAU_LABELS.get(payload.bureau, payload.bureau.title()),
        reason=payload.reason,
        stage=payload.stage,
        stage_label=DISPUTE_STAGE_LABELS[payload.stage],
        opened_at=now,
        last_update_at=now,
    )


@router.patch("/disputes/{dispute_id}")
async def update_dispute(
    dispute_id: str,
    payload: DisputeUpdate,
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> dict[str, str]:
    oid = to_object_id(dispute_id)
    updates = payload.model_dump(exclude_unset=True)
    if oid is None or not updates:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dispute not found.")
    updates["last_update_at"] = utcnow()
    result = await db.disputes.update_one({"_id": oid}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dispute not found.")
    return {"message": "Dispute updated."}


# --- staff + notifications -------------------------------------------------


@router.get("/specialists")
async def list_specialists(db: AsyncIOMotorDatabase = Depends(get_db)) -> list[dict[str, str]]:
    cursor = db.users.find(
        {"role": {"$in": [UserRole.ADMIN.value, UserRole.SPECIALIST.value]}, "active": True},
        {"first_name": 1, "last_name": 1, "email": 1, "role": 1},
    )
    return [
        {
            "id": str(doc["_id"]),
            "name": f"{doc.get('first_name', '')} {doc.get('last_name', '')}".strip(),
            "email": doc["email"],
            "role": doc.get("role", "specialist"),
        }
        async for doc in cursor
    ]


def _staff_member(record: dict) -> StaffMember:
    return StaffMember(
        id=str(record["_id"]),
        email=record["email"],
        first_name=record.get("first_name", ""),
        last_name=record.get("last_name", ""),
        role=record.get("role", UserRole.SPECIALIST.value),
        active=record.get("active", True),
        self_registered=record.get("self_registered", False),
        approved_at=record.get("approved_at"),
        created_at=record.get("created_at"),
        last_login_at=record.get("last_login_at"),
    )


async def _staff_record(db: AsyncIOMotorDatabase, user_id: str) -> dict:
    """Load a staff user, refusing ids that aren't staff at all."""
    oid = to_object_id(user_id)
    record = await db.users.find_one({"_id": oid}) if oid else None
    if record is None or record.get("role") not in (
        UserRole.ADMIN.value,
        UserRole.SPECIALIST.value,
    ):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Staff member not found."
        )
    return record


@router.get("/staff", response_model=list[StaffMember])
async def list_staff(db: AsyncIOMotorDatabase = Depends(get_db)) -> list[StaffMember]:
    """Every admin and specialist, including accounts awaiting approval."""
    cursor = db.users.find(
        {"role": {"$in": [UserRole.ADMIN.value, UserRole.SPECIALIST.value]}}
    ).sort("created_at", -1)
    return [_staff_member(doc) async for doc in cursor]


@router.post("/staff/{user_id}/approve", response_model=StaffMember)
async def approve_staff(
    user_id: str,
    user: AuthenticatedUser = Depends(require_admin),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> StaffMember:
    """Activate a specialist account. Administrators only — this grants access
    to every client file, document and dispute."""
    record = await _staff_record(db, user_id)
    if record.get("active", True):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This account is already active.",
        )

    now = utcnow()
    await db.users.update_one(
        {"_id": record["_id"]},
        {"$set": {"active": True, "approved_at": now, "approved_by": user.id}},
    )
    record = {**record, "active": True, "approved_at": now}

    name = f"{record.get('first_name', '')} {record.get('last_name', '')}".strip()
    await notify(
        db,
        recipient=str(record["_id"]),
        title="Your Creditxora specialist account is approved",
        body=(
            f"Hi {record.get('first_name', '')},\n\n"
            "Your specialist account has been approved. You can now sign in to the "
            "Creditxora dashboard.\n\n"
            "Client files contain sensitive personal and financial information — "
            "access only the files you are working on."
        ),
        kind="staff",
        link="/admin",
        email_to=record["email"],
    )
    await log_activity(
        db,
        subject_id=str(record["_id"]),
        subject_type="staff",
        activity_type=ActivityType.STATUS_CHANGED,
        summary=f"Specialist account approved for {name or record['email']}.",
        actor_name=user.full_name,
        actor_id=user.id,
    )
    return _staff_member(record)


@router.post("/staff/{user_id}/revoke", response_model=StaffMember)
async def revoke_staff(
    user_id: str,
    user: AuthenticatedUser = Depends(require_admin),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> StaffMember:
    """Deactivate a staff account. Existing tokens stop working immediately —
    the auth dependency reloads the user on every request."""
    record = await _staff_record(db, user_id)
    if str(record["_id"]) == user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You can't deactivate your own account.",
        )
    if not record.get("active", True):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This account is already inactive.",
        )

    await db.users.update_one(
        {"_id": record["_id"]},
        {"$set": {"active": False, "deactivated_at": utcnow(), "deactivated_by": user.id}},
    )
    record = {**record, "active": False}

    name = f"{record.get('first_name', '')} {record.get('last_name', '')}".strip()
    await log_activity(
        db,
        subject_id=str(record["_id"]),
        subject_type="staff",
        activity_type=ActivityType.STATUS_CHANGED,
        summary=f"Staff access revoked for {name or record['email']}.",
        actor_name=user.full_name,
        actor_id=user.id,
    )
    return _staff_member(record)


@router.delete("/staff/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def decline_staff(
    user_id: str,
    user: AuthenticatedUser = Depends(require_admin),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> None:
    """Clear a specialist request that should never have been made. Only ever
    removes an account that was self-registered, never approved and never
    active, so there is nothing else in the database referring to it."""
    record = await _staff_record(db, user_id)
    if (
        record.get("role") != UserRole.SPECIALIST.value
        or record.get("active", True)
        or record.get("approved_at") is not None
        or not record.get("self_registered")
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Only a pending specialist request can be declined. Deactivate an "
                "approved account instead."
            ),
        )

    name = f"{record.get('first_name', '')} {record.get('last_name', '')}".strip()
    await db.users.delete_one({"_id": record["_id"]})
    await log_activity(
        db,
        subject_id=str(record["_id"]),
        subject_type="staff",
        activity_type=ActivityType.STATUS_CHANGED,
        summary=f"Specialist request declined for {name or record['email']}.",
        actor_name=user.full_name,
        actor_id=user.id,
    )


@router.get("/notifications")
async def admin_notifications(
    limit: int = Query(default=30, ge=1, le=100),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> list[dict]:
    cursor = db.notifications.find({"recipient": "admin"}).sort("created_at", -1).limit(limit)
    return [serialize(doc) async for doc in cursor]


@router.post("/notifications/read", status_code=status.HTTP_204_NO_CONTENT)
async def mark_admin_notifications_read(
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> None:
    await db.notifications.update_many(
        {"recipient": "admin", "read": False}, {"$set": {"read": True}}
    )


@router.get("/contact-requests")
async def list_contact_requests(
    limit: int = Query(default=50, ge=1, le=200),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> list[dict]:
    cursor = db.contact_requests.find({}).sort("created_at", -1).limit(limit)
    return [serialize(doc) async for doc in cursor]
