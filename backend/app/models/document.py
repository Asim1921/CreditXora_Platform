"""Secure document upload schemas."""

from __future__ import annotations

from datetime import datetime

from pydantic import Field

from app.models.common import ApiModel, DocumentCategory, DocumentStatus


class DocumentItem(ApiModel):
    id: str
    client_id: str
    filename: str
    category: DocumentCategory
    category_label: str
    content_type: str
    size_bytes: int
    status: DocumentStatus
    uploaded_at: datetime
    uploaded_by_name: str
    reviewed_at: datetime | None = None
    reviewer_note: str | None = None


class DocumentUploadResponse(ApiModel):
    document: DocumentItem
    message: str = "Document uploaded successfully"


class DocumentReviewUpdate(ApiModel):
    status: DocumentStatus
    reviewer_note: str | None = Field(default=None, max_length=1000)
