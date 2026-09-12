"""MongoDB connection lifecycle and index management."""

from __future__ import annotations

import logging

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo import ASCENDING, DESCENDING, TEXT
from pymongo.errors import PyMongoError

from app.core.config import settings

logger = logging.getLogger(__name__)

_client: AsyncIOMotorClient | None = None
_db: AsyncIOMotorDatabase | None = None


async def connect_to_mongo() -> None:
    global _client, _db
    _client = AsyncIOMotorClient(
        settings.mongodb_uri,
        serverSelectionTimeoutMS=5000,
        uuidRepresentation="standard",
    )
    _db = _client[settings.mongodb_db]
    await _client.admin.command("ping")
    logger.info("Connected to MongoDB database %r", settings.mongodb_db)
    await ensure_indexes(_db)


async def close_mongo_connection() -> None:
    global _client, _db
    if _client is not None:
        _client.close()
    _client = None
    _db = None


def get_database() -> AsyncIOMotorDatabase:
    if _db is None:
        raise RuntimeError("MongoDB is not connected. Did startup run?")
    return _db


def is_connected() -> bool:
    return _db is not None


async def ensure_indexes(db: AsyncIOMotorDatabase) -> None:
    """Create the indexes the app relies on. Safe to run on every boot."""
    try:
        await db.users.create_index([("email", ASCENDING)], unique=True)
        await db.users.create_index([("role", ASCENDING)])

        await db.leads.create_index([("email", ASCENDING)])
        await db.leads.create_index([("status", ASCENDING), ("created_at", DESCENDING)])
        await db.leads.create_index([("reference", ASCENDING)], unique=True)
        await db.leads.create_index([("assigned_to", ASCENDING)])
        await db.leads.create_index([("next_follow_up_at", ASCENDING)])
        await db.leads.create_index(
            [("first_name", TEXT), ("last_name", TEXT), ("email", TEXT), ("phone", TEXT)],
            name="lead_search",
        )

        await db.clients.create_index([("user_id", ASCENDING)], unique=True)
        await db.clients.create_index([("status", ASCENDING)])
        await db.clients.create_index([("lead_id", ASCENDING)])

        await db.documents.create_index([("client_id", ASCENDING), ("uploaded_at", DESCENDING)])
        await db.documents.create_index([("status", ASCENDING)])

        await db.activities.create_index([("subject_id", ASCENDING), ("created_at", DESCENDING)])
        await db.notifications.create_index([("recipient", ASCENDING), ("created_at", DESCENDING)])
        await db.notifications.create_index([("read", ASCENDING)])

        await db.tasks.create_index([("client_id", ASCENDING), ("due_at", ASCENDING)])
        await db.messages.create_index([("thread_id", ASCENDING), ("created_at", ASCENDING)])
        await db.disputes.create_index([("client_id", ASCENDING), ("opened_at", DESCENDING)])
        await db.contact_requests.create_index([("created_at", DESCENDING)])
    except PyMongoError:
        logger.exception("Failed to create one or more MongoDB indexes")
        raise
