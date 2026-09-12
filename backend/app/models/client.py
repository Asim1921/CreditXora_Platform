"""Client portal and client-record schemas."""

from __future__ import annotations

from datetime import datetime

from pydantic import EmailStr, Field

from app.models.common import (
    ApiModel,
    ClientStatus,
    DisputeStage,
    JourneyPhase,
    TaskStatus,
)


class BureauStatus(ApiModel):
    bureau: str
    label: str
    report_on_file: bool = False
    last_updated_at: datetime | None = None
    # Process state only — never an outcome promise.
    note: str | None = None


class JourneyStep(ApiModel):
    phase: JourneyPhase
    label: str
    state: str  # "complete" | "current" | "upcoming"
    completed_at: datetime | None = None


class TaskItem(ApiModel):
    id: str
    title: str
    description: str | None = None
    status: TaskStatus
    due_at: datetime | None = None
    owner: str = "client"  # "client" | "creditxora"
    created_at: datetime


class TaskCreate(ApiModel):
    title: str = Field(min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=2000)
    due_at: datetime | None = None
    owner: str = "client"


class TaskUpdate(ApiModel):
    status: TaskStatus


class DisputeItem(ApiModel):
    id: str
    account_name: str
    bureau: str
    bureau_label: str
    reason: str
    stage: DisputeStage
    stage_label: str
    opened_at: datetime
    last_update_at: datetime | None = None
    outcome_note: str | None = None


class DisputeCreate(ApiModel):
    account_name: str = Field(min_length=1, max_length=160)
    bureau: str
    reason: str = Field(min_length=1, max_length=400)
    stage: DisputeStage = DisputeStage.PREPARED


class DisputeUpdate(ApiModel):
    stage: DisputeStage | None = None
    outcome_note: str | None = Field(default=None, max_length=1000)


class MessageItem(ApiModel):
    id: str
    body: str
    author_name: str
    author_role: str
    created_at: datetime
    read: bool = False


class MessageCreate(ApiModel):
    body: str = Field(min_length=1, max_length=4000)


class NotificationItem(ApiModel):
    id: str
    title: str
    body: str
    kind: str
    read: bool = False
    created_at: datetime
    link: str | None = None


class AppointmentItem(ApiModel):
    id: str
    title: str
    scheduled_for: datetime
    duration_minutes: int
    kind: str
    status: str
    location: str = "Phone call"


class PaymentItem(ApiModel):
    id: str
    description: str
    amount_cents: int
    currency: str = "USD"
    status: str
    due_at: datetime | None = None
    paid_at: datetime | None = None


class ClientProfile(ApiModel):
    id: str
    user_id: str
    reference: str
    first_name: str
    last_name: str
    email: EmailStr
    phone: str
    state: str
    zip_code: str | None = None
    package: str
    status: ClientStatus
    status_label: str
    current_phase: JourneyPhase
    phase_label: str
    assigned_specialist_id: str | None = None
    assigned_specialist_name: str | None = None
    start_date: datetime
    next_follow_up_at: datetime | None = None
    goals: list[str] = Field(default_factory=list)
    concerns: list[str] = Field(default_factory=list)


class PortalDashboard(ApiModel):
    """Everything the client dashboard renders in one round-trip."""

    profile: ClientProfile
    journey: list[JourneyStep]
    bureau_status: list[BureauStatus]
    documents_count: int
    pending_tasks: list[TaskItem]
    recent_disputes: list[DisputeItem]
    unread_messages: int
    unread_notifications: int
    next_appointment: AppointmentItem | None = None
    outstanding_payment: PaymentItem | None = None
    status_note: str


class ClientUpdate(ApiModel):
    status: ClientStatus | None = None
    current_phase: JourneyPhase | None = None
    package: str | None = Field(default=None, max_length=80)
    assigned_specialist_id: str | None = None
    next_follow_up_at: datetime | None = None
    payment_status: str | None = None


class ClientNoteCreate(ApiModel):
    body: str = Field(min_length=1, max_length=4000)


class ClientSummary(ApiModel):
    """Row shape for the admin clients table."""

    id: str
    reference: str
    first_name: str
    last_name: str
    email: EmailStr
    phone: str
    state: str
    package: str
    status: ClientStatus
    status_label: str
    current_phase: JourneyPhase
    phase_label: str
    assigned_specialist_name: str | None = None
    start_date: datetime
    next_follow_up_at: datetime | None = None
    documents_count: int = 0
    payment_status: str = "unpaid"
    open_tasks: int = 0
