"""Client portal: dashboard, journey, tasks, disputes, messages, notifications."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.deps import get_db, require_client
from app.models.client import (
    AppointmentItem,
    DisputeItem,
    MessageCreate,
    MessageItem,
    NotificationItem,
    PaymentItem,
    PortalDashboard,
    TaskItem,
    TaskUpdate,
)
from app.models.common import (
    BUREAU_LABELS,
    DISPUTE_STAGE_LABELS,
    ActivityType,
    TaskStatus,
    to_object_id,
    utcnow,
)
from app.models.user import AuthenticatedUser
from app.services.activity import log_activity
from app.services.clients import (
    build_bureau_status,
    build_client_profile,
    build_journey,
    status_note,
)
from app.services.notifications import notify

router = APIRouter(prefix="/portal", tags=["portal"])


async def get_client_record(
    db: AsyncIOMotorDatabase, user: AuthenticatedUser = Depends(require_client)
) -> dict:
    record = await db.clients.find_one({"user_id": user.id})
    if record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No client file is linked to this account yet.",
        )
    return record


async def current_client(
    user: AuthenticatedUser = Depends(require_client),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> dict:
    return await get_client_record(db, user)


def _task_item(doc: dict) -> TaskItem:
    return TaskItem(
        id=str(doc["_id"]),
        title=doc["title"],
        description=doc.get("description"),
        status=doc.get("status", TaskStatus.OPEN.value),
        due_at=doc.get("due_at"),
        owner=doc.get("owner", "client"),
        created_at=doc["created_at"],
    )


def _dispute_item(doc: dict) -> DisputeItem:
    stage = doc.get("stage", "prepared")
    bureau = doc.get("bureau", "experian")
    return DisputeItem(
        id=str(doc["_id"]),
        account_name=doc.get("account_name", ""),
        bureau=bureau,
        bureau_label=BUREAU_LABELS.get(bureau, bureau.title()),
        reason=doc.get("reason", ""),
        stage=stage,
        stage_label=DISPUTE_STAGE_LABELS.get(stage, stage.replace("_", " ").title()),
        opened_at=doc["opened_at"],
        last_update_at=doc.get("last_update_at"),
        outcome_note=doc.get("outcome_note"),
    )


@router.get("/dashboard", response_model=PortalDashboard)
async def dashboard(
    client: dict = Depends(current_client),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> PortalDashboard:
    client_id = str(client["_id"])
    user_id = str(client["user_id"])

    profile = await build_client_profile(db, client)
    journey = build_journey(client.get("current_phase", "assessment"), client.get("phase_history"))
    bureaus = await build_bureau_status(db, client_id)

    documents_count = await db.documents.count_documents({"client_id": client_id})
    unread_messages = await db.messages.count_documents(
        {"thread_id": client_id, "author_role": {"$ne": "client"}, "read": False}
    )
    unread_notifications = await db.notifications.count_documents(
        {"recipient": user_id, "read": False}
    )

    pending_cursor = (
        db.tasks.find({"client_id": client_id, "status": {"$ne": TaskStatus.DONE.value}})
        .sort("due_at", 1)
        .limit(5)
    )
    pending_tasks = [_task_item(doc) async for doc in pending_cursor]

    dispute_cursor = db.disputes.find({"client_id": client_id}).sort("opened_at", -1).limit(5)
    recent_disputes = [_dispute_item(doc) async for doc in dispute_cursor]

    appointment_doc = await db.appointments.find_one(
        {"client_id": client_id, "scheduled_for": {"$gte": utcnow()}},
        sort=[("scheduled_for", 1)],
    )
    next_appointment = (
        AppointmentItem(
            id=str(appointment_doc["_id"]),
            title=appointment_doc.get("title", "Consultation"),
            scheduled_for=appointment_doc["scheduled_for"],
            duration_minutes=appointment_doc.get("duration_minutes", 30),
            kind=appointment_doc.get("kind", "consultation"),
            status=appointment_doc.get("status", "confirmed"),
            location=appointment_doc.get("location", "Phone call"),
        )
        if appointment_doc
        else None
    )

    payment_doc = await db.payments.find_one(
        {"client_id": client_id, "status": {"$in": ["due", "overdue"]}},
        sort=[("due_at", 1)],
    )
    outstanding_payment = (
        PaymentItem(
            id=str(payment_doc["_id"]),
            description=payment_doc.get("description", "Service payment"),
            amount_cents=payment_doc.get("amount_cents", 0),
            currency=payment_doc.get("currency", "USD"),
            status=payment_doc.get("status", "due"),
            due_at=payment_doc.get("due_at"),
            paid_at=payment_doc.get("paid_at"),
        )
        if payment_doc
        else None
    )

    return PortalDashboard(
        profile=profile,
        journey=journey,
        bureau_status=bureaus,
        documents_count=documents_count,
        pending_tasks=pending_tasks,
        recent_disputes=recent_disputes,
        unread_messages=unread_messages,
        unread_notifications=unread_notifications,
        next_appointment=next_appointment,
        outstanding_payment=outstanding_payment,
        status_note=status_note(client.get("status", "active")),
    )


@router.get("/tasks", response_model=list[TaskItem])
async def list_tasks(
    client: dict = Depends(current_client),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> list[TaskItem]:
    cursor = db.tasks.find({"client_id": str(client["_id"])}).sort("created_at", -1)
    return [_task_item(doc) async for doc in cursor]


@router.patch("/tasks/{task_id}", response_model=TaskItem)
async def update_task(
    task_id: str,
    payload: TaskUpdate,
    client: dict = Depends(current_client),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> TaskItem:
    oid = to_object_id(task_id)
    if oid is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found.")
    result = await db.tasks.find_one_and_update(
        {"_id": oid, "client_id": str(client["_id"]), "owner": "client"},
        {"$set": {"status": payload.status, "updated_at": utcnow()}},
        return_document=True,
    )
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found.")
    if payload.status == TaskStatus.DONE:
        await notify(
            db,
            recipient="admin",
            title="Client completed a task",
            body=f"{client['first_name']} {client['last_name']} marked \"{result['title']}\" as done.",
            kind="task",
            link=f"/admin/clients/{client['_id']}",
        )
    return _task_item(result)


@router.get("/disputes", response_model=list[DisputeItem])
async def list_disputes(
    client: dict = Depends(current_client),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> list[DisputeItem]:
    cursor = db.disputes.find({"client_id": str(client["_id"])}).sort("opened_at", -1)
    return [_dispute_item(doc) async for doc in cursor]


@router.get("/messages", response_model=list[MessageItem])
async def list_messages(
    client: dict = Depends(current_client),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> list[MessageItem]:
    client_id = str(client["_id"])
    cursor = db.messages.find({"thread_id": client_id}).sort("created_at", 1)
    items = [
        MessageItem(
            id=str(doc["_id"]),
            body=doc["body"],
            author_name=doc.get("author_name", "Creditxora"),
            author_role=doc.get("author_role", "specialist"),
            created_at=doc["created_at"],
            read=doc.get("read", False),
        )
        async for doc in cursor
    ]
    await db.messages.update_many(
        {"thread_id": client_id, "author_role": {"$ne": "client"}, "read": False},
        {"$set": {"read": True}},
    )
    return items


@router.post("/messages", response_model=MessageItem, status_code=status.HTTP_201_CREATED)
async def send_message(
    payload: MessageCreate,
    client: dict = Depends(current_client),
    user: AuthenticatedUser = Depends(require_client),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> MessageItem:
    client_id = str(client["_id"])
    now = utcnow()
    document = {
        "thread_id": client_id,
        "client_id": client_id,
        "body": payload.body,
        "author_name": user.full_name,
        "author_role": "client",
        "read": False,
        "created_at": now,
    }
    result = await db.messages.insert_one(document)
    await log_activity(
        db,
        subject_id=client_id,
        subject_type="client",
        activity_type=ActivityType.MESSAGE_SENT,
        summary="Client sent a message through the portal.",
        actor_name=user.full_name,
        actor_id=user.id,
    )
    await notify(
        db,
        recipient="admin",
        title="New client message",
        body=f"{user.full_name}: {payload.body[:180]}",
        kind="message",
        link=f"/admin/clients/{client_id}",
    )
    return MessageItem(
        id=str(result.inserted_id),
        body=payload.body,
        author_name=user.full_name,
        author_role="client",
        created_at=now,
        read=False,
    )


@router.get("/notifications", response_model=list[NotificationItem])
async def list_notifications(
    user: AuthenticatedUser = Depends(require_client),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> list[NotificationItem]:
    cursor = db.notifications.find({"recipient": user.id}).sort("created_at", -1).limit(50)
    return [
        NotificationItem(
            id=str(doc["_id"]),
            title=doc["title"],
            body=doc["body"],
            kind=doc.get("kind", "update"),
            read=doc.get("read", False),
            created_at=doc["created_at"],
            link=doc.get("link"),
        )
        async for doc in cursor
    ]


@router.post("/notifications/read", status_code=status.HTTP_204_NO_CONTENT)
async def mark_notifications_read(
    user: AuthenticatedUser = Depends(require_client),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> None:
    await db.notifications.update_many(
        {"recipient": user.id, "read": False}, {"$set": {"read": True}}
    )


@router.get("/appointments", response_model=list[AppointmentItem])
async def list_appointments(
    client: dict = Depends(current_client),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> list[AppointmentItem]:
    cursor = db.appointments.find({"client_id": str(client["_id"])}).sort("scheduled_for", 1)
    return [
        AppointmentItem(
            id=str(doc["_id"]),
            title=doc.get("title", "Consultation"),
            scheduled_for=doc["scheduled_for"],
            duration_minutes=doc.get("duration_minutes", 30),
            kind=doc.get("kind", "consultation"),
            status=doc.get("status", "confirmed"),
            location=doc.get("location", "Phone call"),
        )
        async for doc in cursor
    ]


@router.get("/payments", response_model=list[PaymentItem])
async def list_payments(
    client: dict = Depends(current_client),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> list[PaymentItem]:
    cursor = db.payments.find({"client_id": str(client["_id"])}).sort("due_at", -1)
    return [
        PaymentItem(
            id=str(doc["_id"]),
            description=doc.get("description", "Service payment"),
            amount_cents=doc.get("amount_cents", 0),
            currency=doc.get("currency", "USD"),
            status=doc.get("status", "due"),
            due_at=doc.get("due_at"),
            paid_at=doc.get("paid_at"),
        )
        async for doc in cursor
    ]
