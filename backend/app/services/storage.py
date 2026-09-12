"""Encrypted-at-rest storage for uploaded credit reports and supporting files.

Files never touch the database or an email inbox: bytes are encrypted with a
Fernet key and written under `var/uploads/<client_id>/<uuid>.enc`, and only the
metadata is stored in Mongo. Downloads are streamed back through an authorised
endpoint after decryption, so the raw blobs are useless if the disk is copied.
"""

from __future__ import annotations

import re
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status

from app.core.config import settings
from app.core.security import decrypt_bytes, encrypt_bytes

_UNSAFE_CHARS = re.compile(r"[^A-Za-z0-9._-]+")
_MAGIC_PREFIXES: dict[str, tuple[bytes, ...]] = {
    "application/pdf": (b"%PDF-",),
    "image/png": (b"\x89PNG\r\n\x1a\n",),
    "image/jpeg": (b"\xff\xd8\xff",),
    "image/webp": (b"RIFF",),
}


def sanitize_filename(filename: str | None) -> str:
    """Strip path components and unsafe characters from a client-supplied name."""
    base = Path(filename or "document").name
    cleaned = _UNSAFE_CHARS.sub("_", base).strip("._") or "document"
    return cleaned[:120]


def _client_dir(client_id: str) -> Path:
    directory = Path(settings.upload_dir) / client_id
    directory.mkdir(parents=True, exist_ok=True)
    return directory


async def save_upload(upload: UploadFile, client_id: str) -> tuple[str, int, bytes]:
    """Validate, encrypt and persist an upload.

    Returns (storage_key, size_in_bytes, first_bytes_for_type_check).
    """
    if upload.content_type not in settings.allowed_upload_types:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Upload a PDF or an image (PNG, JPG, WEBP, HEIC).",
        )

    raw = await upload.read()
    size = len(raw)
    if size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="That file is empty.",
        )
    if size > settings.max_upload_bytes:
        limit_mb = settings.max_upload_bytes // (1024 * 1024)
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Files must be {limit_mb} MB or smaller.",
        )

    # Content-Type is client-supplied; confirm the bytes match for the formats
    # that have a stable signature.
    expected = _MAGIC_PREFIXES.get(upload.content_type or "")
    if expected and not raw.startswith(expected):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="That file does not match the type it claims to be.",
        )

    storage_key = f"{client_id}/{uuid.uuid4().hex}.enc"
    destination = _client_dir(client_id) / Path(storage_key).name
    destination.write_bytes(encrypt_bytes(raw))
    return storage_key, size, raw[:16]


def read_upload(storage_key: str) -> bytes:
    path = Path(settings.upload_dir) / storage_key
    if not path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="That document is no longer available.",
        )
    return decrypt_bytes(path.read_bytes())


def delete_upload(storage_key: str) -> None:
    path = Path(settings.upload_dir) / storage_key
    path.unlink(missing_ok=True)
