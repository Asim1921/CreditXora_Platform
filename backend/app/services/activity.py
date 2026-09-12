"""Append-only activity log powering the CRM communication history."""

from __future__ import annotations

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.models.common import ActivityType, serialize, to_object_id, utcnow


async def log_activity(
    db: AsyncIOMotorDatabase,
    *,
    subject_id: str,
    subject_type: str,
    activity_type: ActivityType,
    summary: str,
    actor_name: str = "System",
    actor_id: str | None = None,
    detail: dict | None = None,
) -> None:
    await db.activities.insert_one(
        {
            "subject_id": subject_id,
            "subject_type": subject_type,  # "lead" | "client"
            "type": activity_type.value,
            "summary": summary,
            "actor_name": actor_name,
            "actor_id": actor_id,
            "detail": detail or {},
            "created_at": utcnow(),
        }
    )


async def list_activity(
    db: AsyncIOMotorDatabase, subject_ids: list[str], limit: int = 50
) -> list[dict]:
    cursor = (
        db.activities.find({"subject_id": {"$in": subject_ids}})
        .sort("created_at", -1)
        .limit(limit)
    )
    return [serialize(doc) async for doc in cursor]


async def resolve_actor_name(db: AsyncIOMotorDatabase, user_id: str | None) -> str | None:
    if not user_id:
        return None
    oid = to_object_id(user_id)
    if oid is None:
        return None
    record = await db.users.find_one({"_id": oid}, {"first_name": 1, "last_name": 1})
    if not record:
        return None
    return f"{record.get('first_name', '')} {record.get('last_name', '')}".strip() or None
