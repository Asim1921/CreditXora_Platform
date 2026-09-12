"""Notification fan-out.

Every notification is persisted so the admin dashboard and the client portal can
render an inbox. When SMTP is configured the same payload is also emailed; with
no SMTP configured (the default in development) the message is logged instead of
being silently dropped.
"""

from __future__ import annotations

import asyncio
import logging
import re
from email.message import EmailMessage
from email.utils import formatdate, make_msgid
from smtplib import SMTP, SMTP_SSL

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.config import settings
from app.models.common import utcnow

logger = logging.getLogger(__name__)

# Header injection guard: a subject is built from user-supplied names, so strip
# anything that could start a new header line.
_HEADER_UNSAFE = re.compile(r"[\r\n]+")


async def notify(
    db: AsyncIOMotorDatabase,
    *,
    recipient: str,
    title: str,
    body: str,
    kind: str,
    link: str | None = None,
    email_to: str | None = None,
    reply_to: str | None = None,
) -> str:
    """Persist a notification and optionally email it.

    `recipient` is either a user id or the literal "admin" for the staff inbox.
    """
    document = {
        "recipient": recipient,
        "title": title,
        "body": body,
        "kind": kind,
        "link": link,
        "read": False,
        "created_at": utcnow(),
    }
    result = await db.notifications.insert_one(document)

    if email_to:
        await send_email(email_to, title, body, reply_to)

    return str(result.inserted_id)


def _send_email_blocking(
    to_address: str, subject: str, body: str, reply_to: str | None = None
) -> None:
    """Synchronous SMTP delivery. Always called off the event loop."""
    if not settings.smtp_enabled:
        logger.info("[email:not-configured] to=%s subject=%s\n%s", to_address, subject, body)
        return

    subject = _HEADER_UNSAFE.sub(" ", subject).strip()
    to_address = _HEADER_UNSAFE.sub("", to_address).strip()

    try:
        message = EmailMessage()
        message["From"] = settings.mail_from
        message["To"] = to_address
        message["Subject"] = subject
        message["Date"] = formatdate(localtime=True)
        message["Message-ID"] = make_msgid(domain="creditxora.com")
        if reply_to:
            # So replying to an alert reaches the person who wrote in, rather
            # than the Creditxora mailbox that sent the alert.
            message["Reply-To"] = _HEADER_UNSAFE.sub("", reply_to).strip()
        message.set_content(body)

        # Port 465 is implicit TLS; 587 (and everything else) is STARTTLS.
        if settings.smtp_port == 465:
            with SMTP_SSL(
                settings.smtp_host, settings.smtp_port, timeout=settings.smtp_timeout_seconds
            ) as smtp:
                smtp.login(settings.smtp_user, settings.smtp_password)
                smtp.send_message(message)
        else:
            with SMTP(
                settings.smtp_host, settings.smtp_port, timeout=settings.smtp_timeout_seconds
            ) as smtp:
                smtp.ehlo()
                smtp.starttls()
                smtp.ehlo()
                smtp.login(settings.smtp_user, settings.smtp_password)
                smtp.send_message(message)

        logger.info("Sent %r email to %s", subject, to_address)
    except Exception:
        # A failed email must never fail the request that triggered it — the
        # notification is already persisted for the dashboard.
        logger.exception("Failed to send %r email to %s", subject, to_address)


# asyncio only holds a weak reference to running tasks, so an un-referenced
# fire-and-forget task can be garbage-collected mid-flight.
_pending: set[asyncio.Task[None]] = set()


async def send_email(
    to_address: str, subject: str, body: str, reply_to: str | None = None
) -> None:
    """Queue mail for delivery and return immediately.

    A Gmail handshake costs ~4 seconds. Waiting for it would mean the visitor
    sits on a spinner for eight seconds after submitting an assessment — the
    single most important action on the site — for a side effect they don't
    need confirmed synchronously. The notification is already persisted to
    MongoDB by the time we get here, so a delivery failure loses nothing that
    isn't recoverable from the dashboard, and it is logged either way.
    """
    if not settings.smtp_enabled:
        # Keep the log line on the caller's path so dev output stays ordered.
        _send_email_blocking(to_address, subject, body, reply_to)
        return

    task = asyncio.create_task(
        asyncio.to_thread(_send_email_blocking, to_address, subject, body, reply_to)
    )
    _pending.add(task)
    task.add_done_callback(_pending.discard)


async def wait_for_pending_email(timeout: float = 30.0) -> None:
    """Drain in-flight sends. Used on shutdown and by the test suite."""
    if not _pending:
        return
    await asyncio.wait(set(_pending), timeout=timeout)


# --- Ready-made notification bodies ---------------------------------------


async def notify_new_assessment(
    db: AsyncIOMotorDatabase, *, reference: str, name: str, email: str, state: str
) -> None:
    await notify(
        db,
        recipient="admin",
        title="New Creditxora Assessment",
        body=(
            f"A new potential client has submitted an assessment.\n\n"
            f"Reference: {reference}\nName: {name}\nEmail: {email}\nState: {state}"
        ),
        kind="lead",
        link="/admin/leads",
        email_to=settings.admin_notification_email,
        reply_to=email,
    )
    await send_email(
        email,
        "We received your Creditxora request",
        (
            f"Hi {name},\n\n"
            "Thank you. Your information has been received. A Creditxora representative "
            "will review your request and contact you regarding the next appropriate steps.\n\n"
            f"Your reference number is {reference}.\n\n"
            "— The Creditxora Team\n\n"
            "Creditxora provides credit report review and dispute-support services. "
            "We do not guarantee specific credit-score increases, deletions, or approvals."
        ),
    )


async def notify_document_uploaded(
    db: AsyncIOMotorDatabase,
    *,
    client_name: str,
    client_id: str,
    filename: str,
    category_label: str,
) -> None:
    await notify(
        db,
        recipient="admin",
        title="Document received",
        body=f"{client_name} uploaded a {category_label.lower()}: {filename}",
        kind="document",
        link=f"/admin/clients/{client_id}",
        email_to=settings.admin_notification_email,
    )


async def notify_client(
    db: AsyncIOMotorDatabase,
    *,
    user_id: str,
    title: str,
    body: str,
    kind: str,
    link: str | None = None,
    email_to: str | None = None,
) -> None:
    await notify(
        db,
        recipient=user_id,
        title=title,
        body=body,
        kind=kind,
        link=link,
        email_to=email_to,
    )
