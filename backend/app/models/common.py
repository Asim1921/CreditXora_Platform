"""Shared enums, helpers and base schemas used across the Creditxora API."""

from __future__ import annotations

import random
import string
from datetime import datetime, timezone
from enum import StrEnum
from typing import Annotated, Any

from bson import ObjectId
from pydantic import BaseModel, BeforeValidator, ConfigDict

# Mongo's ObjectId serialised as a string on the wire.
PyObjectId = Annotated[str, BeforeValidator(str)]


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def to_object_id(value: str) -> ObjectId | None:
    """Return an ObjectId, or None when the string isn't a valid id."""
    try:
        return ObjectId(value)
    except Exception:
        return None


def new_reference(prefix: str) -> str:
    """Human-quotable reference, e.g. CX-7QF4K2 — used in emails and on calls."""
    alphabet = string.ascii_uppercase + string.digits
    return f"{prefix}-{''.join(random.choices(alphabet, k=6))}"


def serialize(document: dict[str, Any]) -> dict[str, Any]:
    """Convert a raw Mongo document into a JSON-safe dict with `id`."""
    if document is None:
        return {}
    out = dict(document)
    if "_id" in out:
        out["id"] = str(out.pop("_id"))
    for key, value in out.items():
        if isinstance(value, ObjectId):
            out[key] = str(value)
        elif isinstance(value, list):
            out[key] = [str(v) if isinstance(v, ObjectId) else v for v in value]
    return out


class ApiModel(BaseModel):
    """Base for every response/request schema."""

    model_config = ConfigDict(
        populate_by_name=True,
        use_enum_values=True,
        str_strip_whitespace=True,
    )


# --- Roles -----------------------------------------------------------------


class UserRole(StrEnum):
    CLIENT = "client"
    SPECIALIST = "specialist"
    ADMIN = "admin"


# --- CRM pipeline ----------------------------------------------------------


class LeadStatus(StrEnum):
    """Mirrors the admin dashboard's Leads columns."""

    NEW = "new"
    CONTACTED = "contacted"
    ASSESSMENT_COMPLETED = "assessment_completed"
    CONSULTATION_BOOKED = "consultation_booked"
    CONVERTED = "converted"
    NOT_INTERESTED = "not_interested"


LEAD_STATUS_LABELS: dict[str, str] = {
    LeadStatus.NEW: "New lead",
    LeadStatus.CONTACTED: "Contacted",
    LeadStatus.ASSESSMENT_COMPLETED: "Assessment completed",
    LeadStatus.CONSULTATION_BOOKED: "Consultation booked",
    LeadStatus.CONVERTED: "Converted",
    LeadStatus.NOT_INTERESTED: "Not interested",
}


class ClientStatus(StrEnum):
    """Mirrors the admin dashboard's Clients columns."""

    ACTIVE = "active"
    PENDING_DOCUMENTS = "pending_documents"
    UNDER_REVIEW = "under_review"
    ACTION_REQUIRED = "action_required"
    FOLLOW_UP_REQUIRED = "follow_up_required"
    COMPLETED = "completed"


CLIENT_STATUS_LABELS: dict[str, str] = {
    ClientStatus.ACTIVE: "Active",
    ClientStatus.PENDING_DOCUMENTS: "Pending documents",
    ClientStatus.UNDER_REVIEW: "Under review",
    ClientStatus.ACTION_REQUIRED: "Action required",
    ClientStatus.FOLLOW_UP_REQUIRED: "Follow-up required",
    ClientStatus.COMPLETED: "Completed",
}


class JourneyPhase(StrEnum):
    """Assessment -> Review -> Action Plan -> Dispute/Follow-up -> Results Review."""

    ASSESSMENT = "assessment"
    REVIEW = "review"
    ACTION_PLAN = "action_plan"
    DISPUTE_FOLLOW_UP = "dispute_follow_up"
    RESULTS_REVIEW = "results_review"


JOURNEY_PHASE_ORDER: list[str] = [
    JourneyPhase.ASSESSMENT,
    JourneyPhase.REVIEW,
    JourneyPhase.ACTION_PLAN,
    JourneyPhase.DISPUTE_FOLLOW_UP,
    JourneyPhase.RESULTS_REVIEW,
]

JOURNEY_PHASE_LABELS: dict[str, str] = {
    JourneyPhase.ASSESSMENT: "Assessment",
    JourneyPhase.REVIEW: "Review",
    JourneyPhase.ACTION_PLAN: "Action Plan",
    JourneyPhase.DISPUTE_FOLLOW_UP: "Dispute / Follow-up",
    JourneyPhase.RESULTS_REVIEW: "Results Review",
}


# --- Credit domain ---------------------------------------------------------


class Bureau(StrEnum):
    EXPERIAN = "experian"
    EQUIFAX = "equifax"
    TRANSUNION = "transunion"


BUREAU_LABELS: dict[str, str] = {
    Bureau.EXPERIAN: "Experian",
    Bureau.EQUIFAX: "Equifax",
    Bureau.TRANSUNION: "TransUnion",
}


class ConcernType(StrEnum):
    COLLECTIONS = "collections"
    CHARGE_OFFS = "charge_offs"
    LATE_PAYMENTS = "late_payments"
    HARD_INQUIRIES = "hard_inquiries"
    REPOSSESSIONS = "repossessions"
    MEDICAL_COLLECTIONS = "medical_collections"
    IDENTITY_THEFT = "identity_theft"
    STUDENT_LOANS = "student_loans"
    PERSONAL_INFO_ERRORS = "personal_info_errors"
    NOT_SURE = "not_sure"


class CreditGoal(StrEnum):
    IMPROVE_PROFILE = "improve_profile"
    AUTO_FINANCING = "auto_financing"
    MORTGAGE = "mortgage"
    BUSINESS_FUNDING = "business_funding"
    CREDIT_CARD_ELIGIBILITY = "credit_card_eligibility"
    GENERAL_IMPROVEMENT = "general_improvement"


class ScoreRange(StrEnum):
    UNDER_500 = "under_500"
    R500_549 = "500_549"
    R550_599 = "550_599"
    R600_649 = "600_649"
    R650_699 = "650_699"
    R700_PLUS = "700_plus"
    UNKNOWN = "unknown"


class DocumentCategory(StrEnum):
    EXPERIAN_REPORT = "experian_report"
    EQUIFAX_REPORT = "equifax_report"
    TRANSUNION_REPORT = "transunion_report"
    SUPPORTING_DOCUMENT = "supporting_document"
    IDENTITY_THEFT_DOCUMENTATION = "identity_theft_documentation"
    ACCOUNT_STATEMENT = "account_statement"
    OTHER = "other"


DOCUMENT_CATEGORY_LABELS: dict[str, str] = {
    DocumentCategory.EXPERIAN_REPORT: "Experian report",
    DocumentCategory.EQUIFAX_REPORT: "Equifax report",
    DocumentCategory.TRANSUNION_REPORT: "TransUnion report",
    DocumentCategory.SUPPORTING_DOCUMENT: "Supporting document",
    DocumentCategory.IDENTITY_THEFT_DOCUMENTATION: "Identity-theft documentation",
    DocumentCategory.ACCOUNT_STATEMENT: "Account statement",
    DocumentCategory.OTHER: "Other documentation",
}


class DocumentStatus(StrEnum):
    RECEIVED = "received"
    IN_REVIEW = "in_review"
    REVIEWED = "reviewed"
    ACTION_NEEDED = "action_needed"


class TaskStatus(StrEnum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    DONE = "done"


class DisputeStage(StrEnum):
    """Deliberately process-oriented: no 'guaranteed removal' wording."""

    PREPARED = "prepared"
    SUBMITTED = "submitted"
    BUREAU_INVESTIGATING = "bureau_investigating"
    RESPONSE_RECEIVED = "response_received"
    CLOSED = "closed"


DISPUTE_STAGE_LABELS: dict[str, str] = {
    DisputeStage.PREPARED: "Prepared",
    DisputeStage.SUBMITTED: "Submitted to bureau",
    DisputeStage.BUREAU_INVESTIGATING: "Bureau investigating",
    DisputeStage.RESPONSE_RECEIVED: "Response received",
    DisputeStage.CLOSED: "Closed",
}


class ActivityType(StrEnum):
    LEAD_CREATED = "lead_created"
    STATUS_CHANGED = "status_changed"
    NOTE_ADDED = "note_added"
    DOCUMENT_UPLOADED = "document_uploaded"
    DOCUMENT_REVIEWED = "document_reviewed"
    CLIENT_CONVERTED = "client_converted"
    PHASE_CHANGED = "phase_changed"
    ASSIGNMENT_CHANGED = "assignment_changed"
    MESSAGE_SENT = "message_sent"
    CONTACT_REQUEST = "contact_request"
