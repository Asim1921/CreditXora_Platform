"""Shared client-record helpers used by both the portal and the admin API."""

from __future__ import annotations

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.models.client import BureauStatus, ClientProfile, JourneyStep
from app.models.common import (
    BUREAU_LABELS,
    CLIENT_STATUS_LABELS,
    DOCUMENT_CATEGORY_LABELS,
    JOURNEY_PHASE_LABELS,
    JOURNEY_PHASE_ORDER,
    Bureau,
    ClientStatus,
    DocumentCategory,
    JourneyPhase,
    to_object_id,
)

# Client-facing copy for each status. Deliberately describes process, never a
# promised outcome.
STATUS_NOTES: dict[str, str] = {
    ClientStatus.ACTIVE: (
        "Your file is active. Your specialist is working through the current phase "
        "of your plan."
    ),
    ClientStatus.PENDING_DOCUMENTS: (
        "We're waiting on documents from you. Uploading them lets your review move "
        "forward."
    ),
    ClientStatus.UNDER_REVIEW: (
        "Your credit reports and documents are being reviewed for potential "
        "inaccuracies."
    ),
    ClientStatus.ACTION_REQUIRED: (
        "There's an open task that needs your attention before we can continue."
    ),
    ClientStatus.FOLLOW_UP_REQUIRED: (
        "We're following up on submitted items and will update you as responses "
        "arrive."
    ),
    ClientStatus.COMPLETED: (
        "The agreed scope of work is complete. Your summary and credit-building "
        "guidance are available below."
    ),
}

DOCUMENT_CATEGORY_TO_BUREAU: dict[str, str] = {
    DocumentCategory.EXPERIAN_REPORT: Bureau.EXPERIAN,
    DocumentCategory.EQUIFAX_REPORT: Bureau.EQUIFAX,
    DocumentCategory.TRANSUNION_REPORT: Bureau.TRANSUNION,
}


def build_journey(current_phase: str, history: dict | None = None) -> list[JourneyStep]:
    """Assessment → Review → Action Plan → Dispute/Follow-up → Results Review."""
    history = history or {}
    try:
        current_index = JOURNEY_PHASE_ORDER.index(current_phase)
    except ValueError:
        current_index = 0

    steps: list[JourneyStep] = []
    for index, phase in enumerate(JOURNEY_PHASE_ORDER):
        if index < current_index:
            state = "complete"
        elif index == current_index:
            state = "current"
        else:
            state = "upcoming"
        steps.append(
            JourneyStep(
                phase=JourneyPhase(phase),
                label=JOURNEY_PHASE_LABELS[phase],
                state=state,
                completed_at=history.get(phase),
            )
        )
    return steps


async def build_bureau_status(
    db: AsyncIOMotorDatabase, client_id: str
) -> list[BureauStatus]:
    """Which bureau reports we hold on file — a fact, not an outcome claim."""
    cursor = db.documents.find(
        {"client_id": client_id, "category": {"$in": list(DOCUMENT_CATEGORY_TO_BUREAU)}},
        {"category": 1, "uploaded_at": 1},
    ).sort("uploaded_at", -1)

    latest: dict[str, object] = {}
    async for doc in cursor:
        bureau = DOCUMENT_CATEGORY_TO_BUREAU[doc["category"]]
        latest.setdefault(bureau, doc["uploaded_at"])

    return [
        BureauStatus(
            bureau=bureau,
            label=BUREAU_LABELS[bureau],
            report_on_file=bureau in latest,
            last_updated_at=latest.get(bureau),
            note=(
                "Report on file and included in your review."
                if bureau in latest
                else "No report uploaded yet."
            ),
        )
        for bureau in (Bureau.EXPERIAN, Bureau.EQUIFAX, Bureau.TRANSUNION)
    ]


async def build_client_profile(
    db: AsyncIOMotorDatabase, record: dict
) -> ClientProfile:
    specialist_name = None
    specialist_id = record.get("assigned_specialist_id")
    if specialist_id:
        oid = to_object_id(specialist_id)
        if oid:
            specialist = await db.users.find_one(
                {"_id": oid}, {"first_name": 1, "last_name": 1}
            )
            if specialist:
                specialist_name = (
                    f"{specialist.get('first_name', '')} {specialist.get('last_name', '')}".strip()
                    or None
                )

    status = record.get("status", ClientStatus.ACTIVE.value)
    phase = record.get("current_phase", JourneyPhase.ASSESSMENT.value)

    return ClientProfile(
        id=str(record["_id"]),
        user_id=str(record["user_id"]),
        reference=record.get("reference", ""),
        first_name=record.get("first_name", ""),
        last_name=record.get("last_name", ""),
        email=record.get("email", ""),
        phone=record.get("phone", ""),
        state=record.get("state", ""),
        zip_code=record.get("zip_code"),
        package=record.get("package", "Credit Profile Review"),
        status=status,
        status_label=CLIENT_STATUS_LABELS.get(status, status.replace("_", " ").title()),
        current_phase=phase,
        phase_label=JOURNEY_PHASE_LABELS.get(phase, phase.replace("_", " ").title()),
        assigned_specialist_id=specialist_id,
        assigned_specialist_name=specialist_name,
        start_date=record.get("start_date"),
        next_follow_up_at=record.get("next_follow_up_at"),
        goals=record.get("goals", []),
        concerns=record.get("concerns", []),
    )


def document_category_label(category: str) -> str:
    return DOCUMENT_CATEGORY_LABELS.get(category, "Document")


def status_note(status: str) -> str:
    return STATUS_NOTES.get(status, STATUS_NOTES[ClientStatus.ACTIVE])
