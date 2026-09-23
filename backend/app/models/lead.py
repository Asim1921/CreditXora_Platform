"""Credit assessment intake and CRM lead schemas."""

from __future__ import annotations

import re
from datetime import datetime

from pydantic import EmailStr, Field, field_validator

from app.models.common import (
    ApiModel,
    Bureau,
    ConcernType,
    CreditGoal,
    LeadStatus,
    ScoreRange,
)

#: Assessment answers an admin may correct from the CRM, mapped to the label
#: used when the change is written to the activity log.
LEAD_DETAIL_FIELDS: dict[str, str] = {
    "first_name": "first name",
    "last_name": "last name",
    "email": "email",
    "phone": "phone",
    "state": "state",
    "zip_code": "ZIP code",
    "concerns": "what they need help with",
    "goals": "credit goals",
    "score_range": "score range",
    "bureaus": "bureaus",
    "negative_accounts": "negative accounts",
    "has_recent_report": "recent report",
    "notes": "their notes",
}

#: Of those, the ones that must always hold a value — a null is ignored rather
#: than wiping an answer the pipeline depends on.
LEAD_REQUIRED_FIELDS: frozenset[str] = frozenset(
    {
        "first_name",
        "last_name",
        "email",
        "phone",
        "state",
        "zip_code",
        "concerns",
        "goals",
        "score_range",
        "bureaus",
        "status",
    }
)

US_STATES: dict[str, str] = {
    "AL": "Alabama", "AK": "Alaska", "AZ": "Arizona", "AR": "Arkansas",
    "CA": "California", "CO": "Colorado", "CT": "Connecticut", "DE": "Delaware",
    "DC": "District of Columbia", "FL": "Florida", "GA": "Georgia", "HI": "Hawaii",
    "ID": "Idaho", "IL": "Illinois", "IN": "Indiana", "IA": "Iowa",
    "KS": "Kansas", "KY": "Kentucky", "LA": "Louisiana", "ME": "Maine",
    "MD": "Maryland", "MA": "Massachusetts", "MI": "Michigan", "MN": "Minnesota",
    "MS": "Mississippi", "MO": "Missouri", "MT": "Montana", "NE": "Nebraska",
    "NV": "Nevada", "NH": "New Hampshire", "NJ": "New Jersey", "NM": "New Mexico",
    "NY": "New York", "NC": "North Carolina", "ND": "North Dakota", "OH": "Ohio",
    "OK": "Oklahoma", "OR": "Oregon", "PA": "Pennsylvania", "RI": "Rhode Island",
    "SC": "South Carolina", "SD": "South Dakota", "TN": "Tennessee", "TX": "Texas",
    "UT": "Utah", "VT": "Vermont", "VA": "Virginia", "WA": "Washington",
    "WV": "West Virginia", "WI": "Wisconsin", "WY": "Wyoming", "PR": "Puerto Rico",
}

_ZIP_RE = re.compile(r"^\d{5}(-\d{4})?$")
_PHONE_DIGITS_RE = re.compile(r"\D")


# Shared by the public intake form and the admin's correction form, so a lead
# edited in the CRM is stored exactly as the wizard would have stored it.


def normalize_state(value: str) -> str:
    code = value.upper()
    if code not in US_STATES:
        raise ValueError("Enter a valid U.S. state.")
    return code


def normalize_zip(value: str) -> str:
    if not _ZIP_RE.match(value):
        raise ValueError("Enter a valid 5-digit ZIP code.")
    return value


def normalize_phone(value: str) -> str:
    digits = _PHONE_DIGITS_RE.sub("", value)
    if len(digits) == 11 and digits.startswith("1"):
        digits = digits[1:]
    if len(digits) != 10:
        raise ValueError("Enter a valid 10-digit U.S. phone number.")
    return f"({digits[0:3]}) {digits[3:6]}-{digits[6:]}"


class AssessmentSubmission(ApiModel):
    """Payload from the 5-step Get Started wizard."""

    # Step 1 — personal information
    first_name: str = Field(min_length=1, max_length=60)
    last_name: str = Field(min_length=1, max_length=60)
    email: EmailStr
    phone: str = Field(min_length=7, max_length=25)
    state: str = Field(min_length=2, max_length=2)
    zip_code: str = Field(min_length=5, max_length=10)

    # Step 2 — what they need help with
    concerns: list[ConcernType] = Field(min_length=1)

    # Step 3 — credit goals
    goals: list[CreditGoal] = Field(min_length=1)

    # Step 4 — current situation
    score_range: ScoreRange = ScoreRange.UNKNOWN
    bureaus: list[Bureau] = Field(default_factory=list)
    negative_accounts: str | None = Field(default=None, max_length=30)
    has_recent_report: bool | None = None

    # Step 5 — consent + free text
    notes: str | None = Field(default=None, max_length=2000)
    consent_contact: bool = False
    source: str | None = Field(default=None, max_length=60)

    @field_validator("state")
    @classmethod
    def _valid_state(cls, value: str) -> str:
        return normalize_state(value)

    @field_validator("zip_code")
    @classmethod
    def _valid_zip(cls, value: str) -> str:
        return normalize_zip(value)

    @field_validator("phone")
    @classmethod
    def _valid_phone(cls, value: str) -> str:
        return normalize_phone(value)

    @field_validator("consent_contact")
    @classmethod
    def _must_consent(cls, value: bool) -> bool:
        if not value:
            raise ValueError("Consent to be contacted is required to submit an assessment.")
        return value


class AssessmentReceipt(ApiModel):
    reference: str
    message: str


class LeadNote(ApiModel):
    body: str = Field(min_length=1, max_length=4000)
    author: str
    created_at: datetime


class LeadSummary(ApiModel):
    """Row shape for the admin leads table."""

    id: str
    reference: str
    first_name: str
    last_name: str
    email: EmailStr
    phone: str
    state: str
    status: LeadStatus
    concerns: list[str] = Field(default_factory=list)
    goals: list[str] = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)
    assigned_to: str | None = None
    assigned_to_name: str | None = None
    next_follow_up_at: datetime | None = None
    created_at: datetime
    updated_at: datetime
    converted_client_id: str | None = None


class LeadDetail(LeadSummary):
    zip_code: str
    score_range: ScoreRange | None = None
    bureaus: list[str] = Field(default_factory=list)
    negative_accounts: str | None = None
    has_recent_report: bool | None = None
    notes: str | None = None
    source: str | None = None
    consent_contact: bool = False
    internal_notes: list[LeadNote] = Field(default_factory=list)


class LeadUpdate(ApiModel):
    """A partial update to a lead.

    Alongside the pipeline fields, staff can correct the answers the client
    gave in the wizard — a mistyped email or the wrong state would otherwise
    strand the lead until they submitted the whole assessment again. Only the
    fields present in the request body are written; ``consent_contact`` is
    deliberately absent, because consent is the client's to give.
    """

    status: LeadStatus | None = None
    assigned_to: str | None = None
    tags: list[str] | None = None
    next_follow_up_at: datetime | None = None

    # Assessment answers, validated exactly as the intake form validates them.
    first_name: str | None = Field(default=None, min_length=1, max_length=60)
    last_name: str | None = Field(default=None, min_length=1, max_length=60)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, min_length=7, max_length=25)
    state: str | None = Field(default=None, min_length=2, max_length=2)
    zip_code: str | None = Field(default=None, min_length=5, max_length=10)
    concerns: list[ConcernType] | None = Field(default=None, min_length=1)
    goals: list[CreditGoal] | None = Field(default=None, min_length=1)
    score_range: ScoreRange | None = None
    bureaus: list[Bureau] | None = None
    negative_accounts: str | None = Field(default=None, max_length=30)
    has_recent_report: bool | None = None
    notes: str | None = Field(default=None, max_length=2000)

    @field_validator("state")
    @classmethod
    def _valid_state(cls, value: str | None) -> str | None:
        return normalize_state(value) if value else None

    @field_validator("zip_code")
    @classmethod
    def _valid_zip(cls, value: str | None) -> str | None:
        return normalize_zip(value) if value else None

    @field_validator("phone")
    @classmethod
    def _valid_phone(cls, value: str | None) -> str | None:
        return normalize_phone(value) if value else None


class LeadNoteCreate(ApiModel):
    body: str = Field(min_length=1, max_length=4000)


class LeadConvertRequest(ApiModel):
    package: str = Field(default="Credit Profile Review", max_length=80)
    assigned_specialist_id: str | None = None
    send_welcome: bool = True


class LeadConvertResponse(ApiModel):
    client_id: str
    user_id: str
    email: EmailStr
    temporary_password: str | None = None
    message: str


class ContactRequest(ApiModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    phone: str | None = Field(default=None, max_length=25)
    reason: str = Field(min_length=1, max_length=80)
    message: str = Field(min_length=1, max_length=4000)
