# Creditxora — Website & Platform

A U.S.-focused credit-services platform: marketing site, credit assessment funnel,
client portal, secure document handling and an internal admin/CRM dashboard.

> **Compliance posture.** Every user-facing string in this codebase describes a
> *process*, never a guaranteed outcome. There are no "guaranteed deletion",
> "100% removal" or "guaranteed score" claims anywhere, dispute stages describe
> where an item sits with a bureau rather than predicting a result, and the
> required consumer-rights and cancellation disclosures are published. The legal
> pages are working drafts and **must be reviewed by a licensed U.S. attorney
> before launch** — the site says so on every legal page.

---

## Stack

| Layer     | Technology                                                        |
| --------- | ----------------------------------------------------------------- |
| Frontend  | Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4  |
| Backend   | FastAPI · Python 3.11 · Pydantic v2                               |
| Database  | MongoDB 7 (Motor async driver)                                     |
| Auth      | JWT access + refresh tokens, bcrypt password hashing               |
| Files     | Fernet-encrypted at rest on disk, metadata only in MongoDB         |

---

## Running it

Three processes: MongoDB, the API, and the web app.

### 1. MongoDB

Anything reachable at `MONGODB_URI` works. Three options:

- **A local MongoDB server.** This development machine already runs one as the
  auto-starting `MongoDB` Windows service on `127.0.0.1:27017`, which is what
  the app currently uses — no extra step needed.
- **Docker**, on a machine without one: `docker compose up -d`. That also starts
  Mongo Express on <http://localhost:8081> for browsing the data.
- **MongoDB Atlas**: set `MONGODB_URI` to the `mongodb+srv://…` string.

> ⚠️ **Don't run the local service and the Docker container at the same time.**
> Both want port 27017. Windows lets them coexist — the service binds
> `127.0.0.1` while Docker binds `0.0.0.0` — so neither errors, but `localhost`
> resolves to the service and the container silently receives nothing. If data
> "disappears", check `netstat -ano | findstr :27017` for two listeners.

### 2. Backend (port 8000)

```bash
cd backend
py -3.11 -m venv .venv
./.venv/Scripts/python.exe -m pip install -r requirements.txt   # macOS/Linux: .venv/bin/python
cp .env.example .env
./.venv/Scripts/python.exe -m uvicorn app.main:app --reload --port 8000
```

Interactive API docs: <http://localhost:8000/docs> · Health: <http://localhost:8000/health>

On first boot the API creates the admin account and, in development, seeds a
realistic demo dataset (6 leads across the pipeline and one fully-populated
client file). Seeding is idempotent and is skipped when `ENVIRONMENT=production`
or `SEED_DEMO_DATA=false`.

### 3. Frontend (port 3000)

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

### Demo accounts

| Role   | Email                     | Password             |
| ------ | ------------------------- | -------------------- |
| Admin  | `admin@creditxora.com`    | `Creditxora!Admin1`  |
| Client | `client@creditxora.com`   | `Creditxora!Client1` |

Change `BOOTSTRAP_ADMIN_PASSWORD` and disable seeding before any real deployment.

---

## What's built (phases 1–6)

### 1. Main website structure
Home, About, Services, How It Works, Results, Credit Resources, FAQ, Contact,
plus a **Get Started** primary CTA. Sticky header with a services mega-menu, a
full footer, and the mobile bottom bar (`Home | Services | Get Started |
Contact`) with a floating Get Started button. Five legal pages are published so
no footer link dead-ends.

### 2. Homepage
Hero with both CTAs and the four trust indicators; an assurance band; all twelve
service cards; the four-step process; differentiators; a client-portal preview;
success stories with the results disclaimer; resources; and an FAQ preview.

### 3. Credit assessment (`/get-started`)
A five-step wizard — personal details → concerns → goals → current situation →
review & submit. Per-step validation, progressive phone formatting, backward
step-jumping from the review screen, an explicit consent gate, and a success
screen showing a quotable reference number (`CX-XXXXXX`). Submitting creates a
lead, logs an activity entry, notifies the admin and emails the client.

### 4. Client portal (`/portal`)
Secure login, then a dashboard with the **Assessment → Review → Action Plan →
Dispute/Follow-up → Results Review** journey tracker, file-status note, stat
tiles, tasks, dispute activity with per-item stage tracks, bureau status,
appointment, outstanding payment and profile. Separate pages for documents,
tasks (client can complete them), dispute history, messaging and notifications.

### 5. Credit report upload
Drag-and-drop or browse, categorised by bureau/document type. Files are size-
and type-checked (including magic-byte verification so a renamed file is
rejected), **encrypted with Fernet before touching disk**, and stored under
`backend/var/uploads/<client_id>/` with only metadata in MongoDB. The UI
confirms "Document uploaded successfully ✓", the admin is notified, a client
stuck on `pending_documents` advances to `under_review` automatically, and the
bureau-status panel updates. Downloads stream back decrypted through an
authorised endpoint.

### 6. Admin dashboard (`/admin`)
Overview with headline metrics, both pipelines (leads and clients) as
proportional bars with click-through filtering, and a live activity feed.
Leads table with debounced search, status filters, follow-up flagging, and a
detail view showing every assessment answer, internal notes, assignment,
follow-up date and **one-click conversion to a client** (creates the portal
login, seeds the onboarding checklist, returns a one-time password). Client
files get a tabbed profile: overview (status, phase, specialist, payment,
notes), documents (upload + review status), tasks, disputes, messaging and full
activity history. Plus admin notifications and contact-request inboxes.

---

## Architecture notes

```
brand_Website/
├── backend/
│   ├── app/
│   │   ├── core/       config, security (JWT, bcrypt, Fernet), dependencies
│   │   ├── db/         Motor client + index management
│   │   ├── models/     Pydantic schemas and the shared domain enums
│   │   ├── routers/    auth · public · portal · documents · admin
│   │   └── services/   storage, notifications, activity log, clients, seed
│   └── var/uploads/    encrypted documents (git-ignored)
├── frontend/src/
│   ├── app/
│   │   ├── (marketing)/  public site
│   │   ├── get-started/  assessment wizard (stripped-back chrome)
│   │   ├── portal/       client area
│   │   ├── admin/        staff area
│   │   └── login/
│   ├── components/  brand · site · marketing · assessment · portal · app · ui
│   └── lib/         api client, auth context, types, content, formatting
└── docker-compose.yml
```

**Roles.** `client`, `specialist`, `admin`. Enforced server-side on every
protected endpoint; `RouteGuard` on the client only prevents the wrong UI from
flashing.

**Domain enums live in one place** (`backend/app/models/common.py`) and are
mirrored in `frontend/src/lib/types.ts`, so lead statuses, client statuses,
journey phases and dispute stages can't drift between the two halves.

**Notifications** are always persisted to MongoDB so the dashboards have an
inbox; they are additionally emailed when SMTP is configured. With no SMTP set
they are logged rather than silently dropped.

### Email

Configured in `backend/.env`. Gmail needs a **16-character App Password**
(2-Step Verification must be on — <https://myaccount.google.com/apppasswords>);
ordinary account passwords are rejected for SMTP.

```ini
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587            # 587 = STARTTLS, 465 = implicit TLS (both supported)
SMTP_USER=you@gmail.com
SMTP_PASSWORD=<app password>
SMTP_FROM_NAME=Creditxora
ADMIN_NOTIFICATION_EMAIL=you@gmail.com
```

What currently goes out:

| Trigger              | To     | Reply-To     |
| -------------------- | ------ | ------------ |
| Assessment submitted | Admin  | The lead     |
| Assessment submitted | Client | —            |
| Contact form         | Admin  | The enquirer |
| Document uploaded    | Admin  | —            |
| Client converted     | Client | —            |

`Reply-To` is set so replying to an alert reaches the person who wrote in,
rather than the Creditxora mailbox that sent it.

**Delivery is fire-and-forget.** A Gmail handshake costs ~4 seconds; awaiting it
made assessment submission an 8-second wait (two emails, sequentially). Mail is
now dispatched on a worker thread and the request returns in ~20 ms. The
notification row is written to MongoDB *before* the send, so a delivery failure
never loses the event — it still appears in the dashboard and is logged.
In-flight sends are drained on shutdown.

> Gmail is fine for development and low volume, but it applies sending limits
> and will land in spam without SPF/DKIM/DMARC on your own domain. For
> production, move to a transactional provider (SES, Postmark, Resend) sending
> from `@creditxora.com`. Only the `SMTP_*` values need to change.

Inbound mail is not polled — the platform sends only. Enquiries arrive in the
**admin dashboard** (`/admin/contact-requests` and `/admin/notifications`), and
the email alert is how you find out about them.

---

## Verification

```bash
cd frontend && npm run build && npx eslint src   # 41 routes, 0 errors
```

The build is clean and TypeScript passes. ESLint reports 0 errors and 11
warnings, all of them `react-hooks/set-state-in-effect` on the client-side
fetch-in-effect pattern — deliberately downgraded to a warning in
`eslint.config.mjs` with the rationale and the migration path written down.

End-to-end flows exercised against the production build with a real browser:
public routes, the contact form, the full five-step wizard (including validation
and consent gates), client sign-in, an actual encrypted upload + decrypted
download round-trip, task completion, messaging, lead→client conversion, admin
filtering and search, role separation (client blocked from `/admin`, signed-out
users redirected), and mobile rendering with no horizontal overflow.

---

## Before going live

These are deliberately **not** done yet, and matter:

1. **Attorney review** of the legal pages, service agreement and business model
   against federal (CROA) and per-state requirements.
2. **Token storage.** Access and refresh tokens currently live in
   `localStorage`, which is reachable by XSS. Moving the API behind the same
   origin (or a Next.js proxy route) and switching to `httpOnly`, `Secure`,
   `SameSite` cookies is the hardening step.
3. **Secrets.** Generate a real `SECRET_KEY` and `STORAGE_ENCRYPTION_KEY`; never
   ship the development defaults. Back the encryption key with a managed KMS
   rather than a file on disk. `backend/.env` holds a live Gmail App Password —
   it is git-ignored, and should be rotated if it is ever shared or committed.
4. **Object storage.** Move uploads from local disk to S3/GCS with
   server-side encryption and lifecycle rules.
5. **Rate limiting** on `/auth/login`, `/assessments` and `/contact`.
6. Disable seeding (`SEED_DEMO_DATA=false`) and change the bootstrap admin
   password.

## Coming in later milestones

Phases 7–24 of the specification: full CRM automation, appointment booking,
payments, live chat, the referral/partner portal, business credit services and
analytics.
