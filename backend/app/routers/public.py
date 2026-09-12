"""Public, unauthenticated endpoints: the assessment funnel and contact form."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Request, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.config import settings
from app.core.deps import get_db
from app.models.common import (
    ActivityType,
    LeadStatus,
    new_reference,
    utcnow,
)
from app.models.lead import (
    US_STATES,
    AssessmentReceipt,
    AssessmentSubmission,
    ContactRequest,
)
from app.services.activity import log_activity
from app.services.notifications import notify, notify_new_assessment

router = APIRouter(tags=["public"])

THANK_YOU = (
    "Thank you. Your information has been received. A Creditxora representative "
    "will review your request and contact you regarding the next appropriate steps."
)


@router.get("/reference/states")
async def list_states() -> list[dict[str, str]]:
    return [{"code": code, "name": name} for code, name in sorted(US_STATES.items())]


@router.post(
    "/assessments",
    response_model=AssessmentReceipt,
    status_code=status.HTTP_201_CREATED,
    summary="Submit the Get Started credit assessment",
)
async def submit_assessment(
    payload: AssessmentSubmission,
    request: Request,
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> AssessmentReceipt:
    now = utcnow()
    reference = new_reference("CX")
    # Reference collisions are astronomically unlikely but cheap to rule out.
    while await db.leads.find_one({"reference": reference}, {"_id": 1}):
        reference = new_reference("CX")

    document = {
        "reference": reference,
        "first_name": payload.first_name,
        "last_name": payload.last_name,
        "email": payload.email.lower(),
        "phone": payload.phone,
        "state": payload.state,
        "zip_code": payload.zip_code,
        "concerns": [c.value if hasattr(c, "value") else c for c in payload.concerns],
        "goals": [g.value if hasattr(g, "value") else g for g in payload.goals],
        "score_range": payload.score_range,
        "bureaus": [b.value if hasattr(b, "value") else b for b in payload.bureaus],
        "negative_accounts": payload.negative_accounts,
        "has_recent_report": payload.has_recent_report,
        "notes": payload.notes,
        "consent_contact": payload.consent_contact,
        "source": payload.source or "website",
        "status": LeadStatus.ASSESSMENT_COMPLETED.value,
        "tags": [],
        "assigned_to": None,
        "internal_notes": [],
        "next_follow_up_at": None,
        "converted_client_id": None,
        "user_agent": request.headers.get("user-agent", "")[:300],
        "created_at": now,
        "updated_at": now,
    }
    result = await db.leads.insert_one(document)
    lead_id = str(result.inserted_id)

    full_name = f"{payload.first_name} {payload.last_name}"
    await log_activity(
        db,
        subject_id=lead_id,
        subject_type="lead",
        activity_type=ActivityType.LEAD_CREATED,
        summary=f"Assessment submitted from the website ({reference}).",
        actor_name=full_name,
    )
    await notify_new_assessment(
        db,
        reference=reference,
        name=full_name,
        email=payload.email,
        state=US_STATES.get(payload.state, payload.state),
    )

    return AssessmentReceipt(reference=reference, message=THANK_YOU)


@router.post(
    "/contact",
    status_code=status.HTTP_201_CREATED,
    summary="Submit the contact form",
)
async def submit_contact(
    payload: ContactRequest,
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> dict[str, str]:
    now = utcnow()
    result = await db.contact_requests.insert_one(
        {
            "name": payload.name,
            "email": payload.email.lower(),
            "phone": payload.phone,
            "reason": payload.reason,
            "message": payload.message,
            "handled": False,
            "created_at": now,
        }
    )
    await log_activity(
        db,
        subject_id=str(result.inserted_id),
        subject_type="contact",
        activity_type=ActivityType.CONTACT_REQUEST,
        summary=f"Contact form submitted — {payload.reason}.",
        actor_name=payload.name,
    )
    await notify(
        db,
        recipient="admin",
        title=f"New contact request — {payload.reason}",
        body=(
            f"{payload.name} ({payload.email})"
            + (f"\nPhone: {payload.phone}" if payload.phone else "")
            + f"\nReason: {payload.reason}\n\n{payload.message}"
        ),
        kind="contact",
        link="/admin/contact-requests",
        email_to=settings.admin_notification_email,
        # Replying to the alert goes straight back to the enquirer.
        reply_to=payload.email,
    )
    return {
        "message": (
            "Thank you for reaching out. A Creditxora representative will respond "
            "during business hours."
        )
    }
