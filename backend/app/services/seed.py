"""Bootstrap the admin account and, in development, a realistic demo dataset.

Everything here is idempotent: it checks before it writes, so restarting the
server never duplicates records.
"""

from __future__ import annotations

import logging
from datetime import timedelta

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.config import settings
from app.core.security import hash_password
from app.models.common import (
    ActivityType,
    Bureau,
    ClientStatus,
    DisputeStage,
    DocumentStatus,
    JourneyPhase,
    LeadStatus,
    TaskStatus,
    UserRole,
    new_reference,
    utcnow,
)
from app.services.activity import log_activity

logger = logging.getLogger(__name__)

DEMO_CLIENT_EMAIL = "client@creditxora.com"
DEMO_CLIENT_PASSWORD = "Creditxora!Client1"
DEMO_SPECIALIST_EMAIL = "specialist@creditxora.com"


async def bootstrap(db: AsyncIOMotorDatabase) -> None:
    admin_id = await _ensure_admin(db)
    if settings.seed_demo_data and not settings.is_production:
        await _seed_demo(db, admin_id)


async def _ensure_admin(db: AsyncIOMotorDatabase) -> str:
    email = settings.bootstrap_admin_email.lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        return str(existing["_id"])

    result = await db.users.insert_one(
        {
            "email": email,
            "first_name": "Creditxora",
            "last_name": "Admin",
            "password_hash": hash_password(settings.bootstrap_admin_password),
            "role": UserRole.ADMIN.value,
            "active": True,
            "must_change_password": not settings.is_production,
            "created_at": utcnow(),
            "last_login_at": None,
        }
    )
    logger.warning(
        "Created bootstrap admin %s — change this password before going live.", email
    )
    return str(result.inserted_id)


async def _ensure_specialist(db: AsyncIOMotorDatabase) -> str:
    existing = await db.users.find_one({"email": DEMO_SPECIALIST_EMAIL})
    if existing:
        return str(existing["_id"])
    result = await db.users.insert_one(
        {
            "email": DEMO_SPECIALIST_EMAIL,
            "first_name": "Dana",
            "last_name": "Whitfield",
            "password_hash": hash_password("Creditxora!Spec1"),
            "role": UserRole.SPECIALIST.value,
            "active": True,
            "must_change_password": False,
            "created_at": utcnow(),
            "last_login_at": None,
        }
    )
    return str(result.inserted_id)


DEMO_LEADS = [
    {
        "first_name": "Marcus", "last_name": "Reed", "email": "marcus.reed@example.com",
        "phone": "(404) 555-0142", "state": "GA", "zip_code": "30303",
        "concerns": ["collections", "charge_offs", "late_payments"],
        "goals": ["mortgage", "improve_profile"], "score_range": "550_599",
        "bureaus": ["experian", "equifax", "transunion"], "negative_accounts": "4-6",
        "has_recent_report": True, "status": LeadStatus.NEW.value, "days_ago": 1,
        "notes": "Wants to be mortgage-ready within 9 months.",
    },
    {
        "first_name": "Aisha", "last_name": "Bello", "email": "aisha.bello@example.com",
        "phone": "(713) 555-0188", "state": "TX", "zip_code": "77002",
        "concerns": ["hard_inquiries", "personal_info_errors"],
        "goals": ["auto_financing"], "score_range": "600_649",
        "bureaus": ["experian"], "negative_accounts": "1-3",
        "has_recent_report": True, "status": LeadStatus.CONTACTED.value, "days_ago": 3,
        "notes": "Two inquiries she doesn't recognise.",
    },
    {
        "first_name": "Daniel", "last_name": "Ortiz", "email": "daniel.ortiz@example.com",
        "phone": "(305) 555-0110", "state": "FL", "zip_code": "33130",
        "concerns": ["medical_collections", "collections"],
        "goals": ["general_improvement"], "score_range": "500_549",
        "bureaus": ["equifax", "transunion"], "negative_accounts": "7-10",
        "has_recent_report": False, "status": LeadStatus.ASSESSMENT_COMPLETED.value,
        "days_ago": 5, "notes": "Hospital billing sent three accounts to collections.",
    },
    {
        "first_name": "Priya", "last_name": "Raman", "email": "priya.raman@example.com",
        "phone": "(206) 555-0173", "state": "WA", "zip_code": "98104",
        "concerns": ["student_loans", "late_payments"],
        "goals": ["credit_card_eligibility", "improve_profile"], "score_range": "650_699",
        "bureaus": ["experian", "transunion"], "negative_accounts": "1-3",
        "has_recent_report": True, "status": LeadStatus.CONSULTATION_BOOKED.value,
        "days_ago": 6, "notes": "Servicer transfer created duplicate reporting.",
    },
    {
        "first_name": "Kevin", "last_name": "Njoroge", "email": "kevin.njoroge@example.com",
        "phone": "(312) 555-0155", "state": "IL", "zip_code": "60601",
        "concerns": ["identity_theft"], "goals": ["business_funding"],
        "score_range": "unknown", "bureaus": ["experian", "equifax", "transunion"],
        "negative_accounts": "Not sure", "has_recent_report": False,
        "status": LeadStatus.NEW.value, "days_ago": 0,
        "notes": "Accounts opened in his name in another state.",
    },
    {
        "first_name": "Tara", "last_name": "Nguyen", "email": "tara.nguyen@example.com",
        "phone": "(602) 555-0126", "state": "AZ", "zip_code": "85004",
        "concerns": ["repossessions", "charge_offs"], "goals": ["auto_financing"],
        "score_range": "under_500", "bureaus": ["equifax"], "negative_accounts": "4-6",
        "has_recent_report": True, "status": LeadStatus.NOT_INTERESTED.value, "days_ago": 12,
        "notes": "Prefers to wait until next year.",
    },
]


async def _seed_demo(db: AsyncIOMotorDatabase, admin_id: str) -> None:
    if await db.leads.count_documents({}) > 0:
        return

    logger.info("Seeding Creditxora demo data")
    specialist_id = await _ensure_specialist(db)
    now = utcnow()

    for entry in DEMO_LEADS:
        # Copy rather than pop: DEMO_LEADS is module-level, so mutating it here
        # would corrupt the template for any later call in the same process.
        fields = {key: value for key, value in entry.items() if key != "days_ago"}
        created = now - timedelta(days=entry["days_ago"])
        document = {
            **fields,
            "reference": new_reference("CX"),
            "email": entry["email"].lower(),
            "consent_contact": True,
            "source": "website",
            "tags": [],
            "assigned_to": specialist_id if entry["status"] != LeadStatus.NEW.value else None,
            "internal_notes": [],
            "next_follow_up_at": (
                created + timedelta(days=2)
                if entry["status"] in (LeadStatus.CONTACTED.value, LeadStatus.CONSULTATION_BOOKED.value)
                else None
            ),
            "converted_client_id": None,
            "created_at": created,
            "updated_at": created,
        }
        result = await db.leads.insert_one(document)
        await log_activity(
            db,
            subject_id=str(result.inserted_id),
            subject_type="lead",
            activity_type=ActivityType.LEAD_CREATED,
            summary=f"Assessment submitted from the website ({document['reference']}).",
            actor_name=f"{entry['first_name']} {entry['last_name']}",
        )

    await _seed_demo_client(db, specialist_id, admin_id)


async def _seed_demo_client(
    db: AsyncIOMotorDatabase, specialist_id: str, admin_id: str
) -> None:
    """A fully-populated client so the portal demonstrates real state."""
    if await db.users.find_one({"email": DEMO_CLIENT_EMAIL}):
        return

    now = utcnow()
    start = now - timedelta(days=24)

    user_result = await db.users.insert_one(
        {
            "email": DEMO_CLIENT_EMAIL,
            "first_name": "Jordan",
            "last_name": "Hale",
            "password_hash": hash_password(DEMO_CLIENT_PASSWORD),
            "role": UserRole.CLIENT.value,
            "active": True,
            "must_change_password": False,
            "created_at": start,
            "last_login_at": now - timedelta(days=1),
        }
    )
    user_id = str(user_result.inserted_id)

    client_result = await db.clients.insert_one(
        {
            "user_id": user_id,
            "lead_id": None,
            "reference": new_reference("CXC"),
            "first_name": "Jordan",
            "last_name": "Hale",
            "email": DEMO_CLIENT_EMAIL,
            "phone": "(704) 555-0199",
            "state": "NC",
            "zip_code": "28202",
            "package": "Full Credit Profile Review",
            "status": ClientStatus.UNDER_REVIEW.value,
            "current_phase": JourneyPhase.DISPUTE_FOLLOW_UP.value,
            "phase_history": {
                JourneyPhase.ASSESSMENT.value: start,
                JourneyPhase.REVIEW.value: start + timedelta(days=4),
                JourneyPhase.ACTION_PLAN.value: start + timedelta(days=11),
            },
            "assigned_specialist_id": specialist_id,
            "start_date": start,
            "next_follow_up_at": now + timedelta(days=4),
            "goals": ["mortgage", "improve_profile"],
            "concerns": ["collections", "late_payments", "hard_inquiries"],
            "payment_status": "paid",
            "internal_notes": [
                {
                    "body": "Client is targeting a mortgage pre-approval in Q3. Prioritise the "
                            "two collection accounts reporting inconsistent balances.",
                    "author": "Dana Whitfield",
                    "created_at": start + timedelta(days=5),
                }
            ],
            "created_at": start,
            "updated_at": now - timedelta(days=2),
        }
    )
    client_id = str(client_result.inserted_id)

    await db.documents.insert_many(
        [
            {
                "client_id": client_id, "filename": "experian_report_march.pdf",
                "category": "experian_report", "content_type": "application/pdf",
                "size_bytes": 842_113, "storage_key": "demo/experian.enc",
                "status": DocumentStatus.REVIEWED.value,
                "uploaded_at": start + timedelta(days=2), "uploaded_by_id": user_id,
                "uploaded_by_name": "Jordan Hale", "uploaded_by_role": "client",
                "reviewed_at": start + timedelta(days=4),
                "reviewer_note": "Two collection accounts flagged for balance inconsistencies.",
                "demo": True,
            },
            {
                "client_id": client_id, "filename": "equifax_report_march.pdf",
                "category": "equifax_report", "content_type": "application/pdf",
                "size_bytes": 764_220, "storage_key": "demo/equifax.enc",
                "status": DocumentStatus.REVIEWED.value,
                "uploaded_at": start + timedelta(days=2), "uploaded_by_id": user_id,
                "uploaded_by_name": "Jordan Hale", "uploaded_by_role": "client",
                "reviewed_at": start + timedelta(days=4),
                "reviewer_note": "Address history contains a former address that isn't yours.",
                "demo": True,
            },
            {
                "client_id": client_id, "filename": "collection_letter.pdf",
                "category": "supporting_document", "content_type": "application/pdf",
                "size_bytes": 118_004, "storage_key": "demo/letter.enc",
                "status": DocumentStatus.IN_REVIEW.value,
                "uploaded_at": now - timedelta(days=3), "uploaded_by_id": user_id,
                "uploaded_by_name": "Jordan Hale", "uploaded_by_role": "client",
                "reviewed_at": None, "reviewer_note": None, "demo": True,
            },
        ]
    )

    await db.tasks.insert_many(
        [
            {
                "client_id": client_id,
                "title": "Upload your TransUnion report",
                "description": "We have Experian and Equifax on file. TransUnion completes the review.",
                "status": TaskStatus.OPEN.value, "owner": "client",
                "due_at": now + timedelta(days=5), "created_at": now - timedelta(days=3),
            },
            {
                "client_id": client_id,
                "title": "Confirm your current mailing address",
                "description": "Your reports list an address you may no longer use.",
                "status": TaskStatus.OPEN.value, "owner": "client",
                "due_at": now + timedelta(days=7), "created_at": now - timedelta(days=2),
            },
            {
                "client_id": client_id,
                "title": "Review your action plan summary",
                "description": "Read the plan your specialist prepared and reply with questions.",
                "status": TaskStatus.DONE.value, "owner": "client",
                "due_at": start + timedelta(days=13), "created_at": start + timedelta(days=11),
            },
        ]
    )

    await db.disputes.insert_many(
        [
            {
                "client_id": client_id, "account_name": "Meridian Recovery LLC",
                "bureau": Bureau.EXPERIAN.value,
                "reason": "Balance reported does not match the creditor's statement.",
                "stage": DisputeStage.BUREAU_INVESTIGATING.value,
                "opened_at": start + timedelta(days=13),
                "last_update_at": now - timedelta(days=5),
                "outcome_note": "Bureau acknowledged receipt; investigation window is open.",
            },
            {
                "client_id": client_id, "account_name": "Former address — Raleigh, NC",
                "bureau": Bureau.EQUIFAX.value,
                "reason": "Personal information lists an address never associated with the client.",
                "stage": DisputeStage.RESPONSE_RECEIVED.value,
                "opened_at": start + timedelta(days=13),
                "last_update_at": now - timedelta(days=8),
                "outcome_note": "Bureau responded; personal information section was updated.",
            },
            {
                "client_id": client_id, "account_name": "Kestrel Bank — auto loan",
                "bureau": Bureau.TRANSUNION.value,
                "reason": "Late payment reported for a month paid on time per bank records.",
                "stage": DisputeStage.PREPARED.value,
                "opened_at": now - timedelta(days=2),
                "last_update_at": now - timedelta(days=2), "outcome_note": None,
            },
        ]
    )

    await db.messages.insert_many(
        [
            {
                "thread_id": client_id, "client_id": client_id,
                "body": "Welcome to Creditxora, Jordan. I've reviewed your Experian and Equifax "
                        "reports and prepared your action plan — it's in your documents tab.",
                "author_name": "Dana Whitfield", "author_role": "specialist", "read": True,
                "created_at": start + timedelta(days=11),
            },
            {
                "thread_id": client_id, "client_id": client_id,
                "body": "Thanks Dana. I've read through it. Should I hold off on applying for "
                        "a new card while this is in progress?",
                "author_name": "Jordan Hale", "author_role": "client", "read": True,
                "created_at": start + timedelta(days=12),
            },
            {
                "thread_id": client_id, "client_id": client_id,
                "body": "Yes — new applications add hard inquiries. Let's revisit after the "
                        "current bureau responses come back.",
                "author_name": "Dana Whitfield", "author_role": "specialist", "read": False,
                "created_at": now - timedelta(days=4),
            },
        ]
    )

    await db.appointments.insert_one(
        {
            "client_id": client_id, "title": "30-minute Credit Consultation",
            "scheduled_for": now + timedelta(days=6, hours=3), "duration_minutes": 30,
            "kind": "consultation", "status": "confirmed", "location": "Phone call",
            "created_at": now - timedelta(days=2),
        }
    )

    await db.payments.insert_many(
        [
            {
                "client_id": client_id, "description": "Full Credit Profile Review — setup",
                "amount_cents": 14900, "currency": "USD", "status": "paid",
                "due_at": start, "paid_at": start,
            },
            {
                "client_id": client_id, "description": "Monthly service — current cycle",
                "amount_cents": 8900, "currency": "USD", "status": "due",
                "due_at": now + timedelta(days=9), "paid_at": None,
            },
        ]
    )

    await db.notifications.insert_many(
        [
            {
                "recipient": user_id, "title": "Your action plan is ready",
                "body": "Your specialist prepared a personalised action plan. Open your "
                        "documents tab to review it.",
                "kind": "phase", "link": "/portal/documents", "read": False,
                "created_at": start + timedelta(days=11),
            },
            {
                "recipient": user_id, "title": "Bureau response received",
                "body": "Equifax responded regarding your personal information dispute.",
                "kind": "dispute", "link": "/portal/disputes", "read": False,
                "created_at": now - timedelta(days=8),
            },
        ]
    )

    for summary, activity_type, days in [
        ("Client file opened.", ActivityType.CLIENT_CONVERTED, 24),
        ("Experian and Equifax reports received.", ActivityType.DOCUMENT_UPLOADED, 22),
        ("Reports reviewed; 3 potential inaccuracies identified.", ActivityType.DOCUMENT_REVIEWED, 20),
        ("Moved to the Action Plan phase.", ActivityType.PHASE_CHANGED, 13),
        ("Moved to the Dispute / Follow-up phase.", ActivityType.PHASE_CHANGED, 11),
    ]:
        await log_activity(
            db,
            subject_id=client_id,
            subject_type="client",
            activity_type=activity_type,
            summary=summary,
            actor_name="Dana Whitfield",
            actor_id=specialist_id,
        )

    await db.notifications.insert_one(
        {
            "recipient": "admin", "title": "Document received",
            "body": "Jordan Hale uploaded a supporting document: collection_letter.pdf",
            "kind": "document", "link": f"/admin/clients/{client_id}", "read": False,
            "created_at": now - timedelta(days=3),
        }
    )
    logger.info("Demo client seeded: %s / %s", DEMO_CLIENT_EMAIL, DEMO_CLIENT_PASSWORD)
