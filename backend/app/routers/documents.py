"""Secure credit-report upload, listing and download."""

from __future__ import annotations

import io

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import StreamingResponse
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.deps import get_current_user, get_db
from app.models.common import (
    ActivityType,
    ClientStatus,
    DocumentCategory,
    DocumentStatus,
    UserRole,
    to_object_id,
    utcnow,
)
from app.models.document import (
    DocumentItem,
    DocumentReviewUpdate,
    DocumentUploadResponse,
)
from app.models.user import AuthenticatedUser
from app.services.activity import log_activity
from app.services.clients import document_category_label
from app.services.notifications import notify_client, notify_document_uploaded
from app.services.storage import read_upload, sanitize_filename, save_upload

router = APIRouter(prefix="/documents", tags=["documents"])


def _document_item(doc: dict) -> DocumentItem:
    category = doc.get("category", DocumentCategory.OTHER.value)
    return DocumentItem(
        id=str(doc["_id"]),
        client_id=doc["client_id"],
        filename=doc["filename"],
        category=category,
        category_label=document_category_label(category),
        content_type=doc.get("content_type", "application/octet-stream"),
        size_bytes=doc.get("size_bytes", 0),
        status=doc.get("status", DocumentStatus.RECEIVED.value),
        uploaded_at=doc["uploaded_at"],
        uploaded_by_name=doc.get("uploaded_by_name", ""),
        reviewed_at=doc.get("reviewed_at"),
        reviewer_note=doc.get("reviewer_note"),
    )


async def _authorized_client(
    db: AsyncIOMotorDatabase, user: AuthenticatedUser, client_id: str | None = None
) -> dict:
    """Resolve the client record this request may act on.

    Clients are locked to their own file; staff may target any client.
    """
    if user.role == UserRole.CLIENT:
        record = await db.clients.find_one({"user_id": user.id})
        if record is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No client file is linked to this account yet.",
            )
        if client_id and client_id != str(record["_id"]):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only access your own documents.",
            )
        return record

    if not client_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A client_id is required.",
        )
    oid = to_object_id(client_id)
    record = await db.clients.find_one({"_id": oid}) if oid else None
    if record is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found.")
    return record


@router.post("", response_model=DocumentUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    category: DocumentCategory = Form(DocumentCategory.OTHER),
    client_id: str | None = Form(default=None),
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> DocumentUploadResponse:
    client = await _authorized_client(db, user, client_id)
    resolved_client_id = str(client["_id"])

    storage_key, size, _ = await save_upload(file, resolved_client_id)
    filename = sanitize_filename(file.filename)
    now = utcnow()

    document = {
        "client_id": resolved_client_id,
        "filename": filename,
        "category": category.value,
        "content_type": file.content_type or "application/octet-stream",
        "size_bytes": size,
        "storage_key": storage_key,
        "status": DocumentStatus.RECEIVED.value,
        "uploaded_at": now,
        "uploaded_by_id": user.id,
        "uploaded_by_name": user.full_name,
        "uploaded_by_role": user.role,
        "reviewed_at": None,
        "reviewer_note": None,
    }
    result = await db.documents.insert_one(document)
    document["_id"] = result.inserted_id

    category_label = document_category_label(category.value)
    await log_activity(
        db,
        subject_id=resolved_client_id,
        subject_type="client",
        activity_type=ActivityType.DOCUMENT_UPLOADED,
        summary=f"{category_label} uploaded: {filename}",
        actor_name=user.full_name,
        actor_id=user.id,
    )

    if user.role == UserRole.CLIENT:
        await notify_document_uploaded(
            db,
            client_name=f"{client['first_name']} {client['last_name']}",
            client_id=resolved_client_id,
            filename=filename,
            category_label=category_label,
        )
        # A client who was blocked on paperwork moves into review automatically.
        if client.get("status") == ClientStatus.PENDING_DOCUMENTS.value:
            await db.clients.update_one(
                {"_id": client["_id"]},
                {"$set": {"status": ClientStatus.UNDER_REVIEW.value, "updated_at": now}},
            )

    return DocumentUploadResponse(document=_document_item(document))


@router.get("", response_model=list[DocumentItem])
async def list_documents(
    client_id: str | None = None,
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> list[DocumentItem]:
    client = await _authorized_client(db, user, client_id)
    cursor = db.documents.find({"client_id": str(client["_id"])}).sort("uploaded_at", -1)
    return [_document_item(doc) async for doc in cursor]


@router.get("/{document_id}/download")
async def download_document(
    document_id: str,
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> StreamingResponse:
    oid = to_object_id(document_id)
    doc = await db.documents.find_one({"_id": oid}) if oid else None
    if doc is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")
    await _authorized_client(db, user, doc["client_id"])

    payload = read_upload(doc["storage_key"])
    return StreamingResponse(
        io.BytesIO(payload),
        media_type=doc.get("content_type", "application/octet-stream"),
        headers={
            "Content-Disposition": f'attachment; filename="{doc["filename"]}"',
            "Cache-Control": "no-store",
        },
    )


@router.patch("/{document_id}", response_model=DocumentItem)
async def review_document(
    document_id: str,
    payload: DocumentReviewUpdate,
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> DocumentItem:
    if not user.is_staff:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Staff access required."
        )
    oid = to_object_id(document_id)
    if oid is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")

    updated = await db.documents.find_one_and_update(
        {"_id": oid},
        {
            "$set": {
                "status": payload.status,
                "reviewer_note": payload.reviewer_note,
                "reviewed_at": utcnow(),
                "reviewed_by_name": user.full_name,
            }
        },
        return_document=True,
    )
    if updated is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")

    client = await db.clients.find_one({"_id": to_object_id(updated["client_id"])})
    if client:
        await log_activity(
            db,
            subject_id=updated["client_id"],
            subject_type="client",
            activity_type=ActivityType.DOCUMENT_REVIEWED,
            summary=f"{updated['filename']} marked {payload.status.replace('_', ' ')}.",
            actor_name=user.full_name,
            actor_id=user.id,
        )
        await notify_client(
            db,
            user_id=str(client["user_id"]),
            title="Document update",
            body=(
                f"Your document \"{updated['filename']}\" was marked "
                f"{payload.status.replace('_', ' ')}."
                + (f"\n\n{payload.reviewer_note}" if payload.reviewer_note else "")
            ),
            kind="document",
            link="/portal/documents",
        )
    return _document_item(updated)
