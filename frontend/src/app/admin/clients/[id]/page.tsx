"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  ActivitySquare,
  ArrowLeft,
  CreditCard,
  FileText,
  Gavel,
  ListChecks,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Plus,
  Send,
  StickyNote,
  UserRound,
} from "lucide-react";

import { DocumentList } from "@/components/portal/DocumentList";
import { DocumentUploader } from "@/components/portal/DocumentUploader";
import { JourneyTracker } from "@/components/portal/JourneyTracker";
import { Button } from "@/components/ui/Button";
import { Field, Select, TextArea, TextInput } from "@/components/ui/Field";
import {
  Alert,
  Badge,
  CLIENT_STATUS_LABEL,
  CLIENT_STATUS_TONE,
  EmptyState,
  LoadingPanel,
  type BadgeTone,
} from "@/components/ui/Primitives";
import { useToast } from "@/components/ui/Toast";
import { ApiError, api } from "@/lib/api";
import { clsx } from "@/lib/clsx";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatRelative,
  humanize,
  initials,
} from "@/lib/format";
import type {
  AdminClientDetail,
  ClientStatus,
  DisputeItem,
  DocumentItem,
  JourneyPhase,
  Specialist,
} from "@/lib/types";

const STATUSES: ClientStatus[] = [
  "active",
  "pending_documents",
  "under_review",
  "action_required",
  "follow_up_required",
  "completed",
];

const PHASES: { value: JourneyPhase; label: string }[] = [
  { value: "assessment", label: "Assessment" },
  { value: "review", label: "Review" },
  { value: "action_plan", label: "Action Plan" },
  { value: "dispute_follow_up", label: "Dispute / Follow-up" },
  { value: "results_review", label: "Results Review" },
];

const DISPUTE_STAGE_TONE: Record<DisputeItem["stage"], BadgeTone> = {
  prepared: "slate",
  submitted: "blue",
  bureau_investigating: "amber",
  response_received: "violet",
  closed: "brand",
};

const TABS = [
  { id: "overview", label: "Overview", icon: UserRound },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "tasks", label: "Tasks", icon: ListChecks },
  { id: "disputes", label: "Disputes", icon: Gavel },
  { id: "messages", label: "Messages", icon: MessageSquare },
  { id: "activity", label: "Activity", icon: ActivitySquare },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function AdminClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();

  const [data, setData] = useState<AdminClientDetail | null>(null);
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabId>("overview");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [detail, staff] = await Promise.all([
        api.get<AdminClientDetail>(`/admin/clients/${id}`, true),
        api.get<Specialist[]>("/admin/specialists", true),
      ]);
      setData(detail);
      setSpecialists(staff);
      setError(null);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "We couldn't load this client.");
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const patch = async (changes: Record<string, unknown>) => {
    setSaving(true);
    try {
      await api.patch(`/admin/clients/${id}`, changes, true);
      await load();
      toast.success("Client updated", "The client has been notified where relevant.");
    } catch (caught) {
      toast.error(
        "Update failed",
        caught instanceof ApiError ? caught.message : "Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (error) return <Alert tone="error">{error}</Alert>;
  if (!data) return <LoadingPanel label="Loading client file…" />;

  const { profile } = data;
  const counts: Partial<Record<TabId, number>> = {
    documents: data.documents.length,
    tasks: data.tasks.filter((task) => task.status !== "done").length,
    disputes: data.disputes.length,
    messages: data.messages.length,
  };

  return (
    <div className="space-y-5">
      <Link
        href="/admin/clients"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition hover:text-navy-900"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back to clients
      </Link>

      {/* Header */}
      <section className="card-surface p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-navy-800 text-lg font-bold text-white">
              {initials(profile.first_name, profile.last_name)}
            </span>
            <div>
              <h2 className="font-display text-2xl font-bold text-navy-900">
                {profile.first_name} {profile.last_name}
              </h2>
              <p className="font-mono text-sm text-muted">{profile.reference}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone={CLIENT_STATUS_TONE[profile.status]} dot>
              {CLIENT_STATUS_LABEL[profile.status]}
            </Badge>
            <Badge tone="neutral">{profile.phase_label}</Badge>
            <Badge tone={data.payment_status === "paid" ? "brand" : "amber"}>
              <CreditCard className="size-3" aria-hidden />
              {humanize(data.payment_status)}
            </Badge>
          </div>
        </div>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <HeaderStat icon={Mail} label="Email" value={profile.email} href={`mailto:${profile.email}`} />
          <HeaderStat
            icon={Phone}
            label="Phone"
            value={profile.phone}
            href={`tel:${profile.phone.replace(/\D/g, "")}`}
          />
          <HeaderStat icon={MapPin} label="State" value={profile.state} />
          <HeaderStat
            icon={UserRound}
            label="Specialist"
            value={profile.assigned_specialist_name ?? "Unassigned"}
          />
        </dl>
      </section>

      {/* Tabs */}
      <div className="scroll-slim flex gap-1 overflow-x-auto border-b border-navy-100">
        {TABS.map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={clsx(
                "-mb-px flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition",
                active
                  ? "border-brand-600 text-brand-700"
                  : "border-transparent text-muted hover:border-navy-200 hover:text-navy-800",
              )}
            >
              <Icon className="size-4" aria-hidden />
              {item.label}
              {counts[item.id] ? (
                <span
                  className={clsx(
                    "rounded-full px-1.5 py-0.5 text-[0.6875rem] font-bold",
                    active ? "bg-brand-100 text-brand-700" : "bg-navy-50 text-navy-600",
                  )}
                >
                  {counts[item.id]}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {tab === "overview" ? (
        <OverviewTab
          data={data}
          specialists={specialists}
          saving={saving}
          onPatch={patch}
          onReload={load}
          clientId={id}
        />
      ) : tab === "documents" ? (
        <DocumentsTab data={data} clientId={id} onReload={load} />
      ) : tab === "tasks" ? (
        <TasksTab data={data} clientId={id} onReload={load} />
      ) : tab === "disputes" ? (
        <DisputesTab data={data} clientId={id} onReload={load} />
      ) : tab === "messages" ? (
        <MessagesTab data={data} clientId={id} onReload={load} />
      ) : (
        <ActivityTab data={data} />
      )}
    </div>
  );
}

// --- Overview --------------------------------------------------------------

function OverviewTab({
  data,
  specialists,
  saving,
  onPatch,
  onReload,
  clientId,
}: {
  data: AdminClientDetail;
  specialists: Specialist[];
  saving: boolean;
  onPatch: (changes: Record<string, unknown>) => Promise<void>;
  onReload: () => Promise<void>;
  clientId: string;
}) {
  const { profile } = data;
  const [note, setNote] = useState("");
  const toast = useToast();

  const addNote = async (event: React.FormEvent) => {
    event.preventDefault();
    const body = note.trim();
    if (!body) return;
    try {
      await api.post(`/admin/clients/${clientId}/notes`, { body }, true);
      setNote("");
      await onReload();
      toast.success("Note added");
    } catch {
      toast.error("Couldn't add that note", "Please try again.");
    }
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[1.4fr_0.6fr]">
      <div className="space-y-5">
        <JourneyTracker journey={data.journey} />

        <section className="card-surface p-6">
          <h3 className="font-display text-lg font-bold text-navy-900">Bureau coverage</h3>
          <ul className="mt-4 grid gap-3 sm:grid-cols-3">
            {data.bureau_status.map((bureau) => (
              <li
                key={bureau.bureau}
                className={clsx(
                  "rounded-xl border p-4",
                  bureau.report_on_file
                    ? "border-brand-200 bg-brand-50/50"
                    : "border-navy-100 bg-navy-50/40",
                )}
              >
                <p className="text-sm font-bold text-navy-900">{bureau.label}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted">{bureau.note}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="card-surface p-6">
          <h3 className="font-display text-lg font-bold text-navy-900">Internal notes</h3>
          <p className="text-sm text-muted">Staff only — never shown to the client.</p>

          <form onSubmit={addNote} className="mt-4">
            <TextArea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Spoke with the client about the Kestrel Bank late payment…"
              className="min-h-20"
            />
            <Button type="submit" size="sm" className="mt-3" disabled={!note.trim()}>
              <StickyNote className="size-4" aria-hidden />
              Add note
            </Button>
          </form>

          {data.internal_notes.length === 0 ? (
            <p className="mt-5 text-sm text-muted">No notes yet.</p>
          ) : (
            <ul className="mt-5 space-y-3">
              {[...data.internal_notes].reverse().map((entry) => (
                <li
                  key={`${entry.created_at}-${entry.body.slice(0, 12)}`}
                  className="rounded-xl border border-navy-100 bg-navy-50/40 p-4"
                >
                  <p className="text-sm leading-relaxed text-navy-800">{entry.body}</p>
                  <p className="mt-2 text-xs text-muted">
                    {entry.author} · {formatDateTime(entry.created_at)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="space-y-5">
        <section className="card-surface p-6">
          <h3 className="font-display text-lg font-bold text-navy-900">Manage file</h3>

          <Field label="Status" className="mt-4" htmlFor="client-status">
            <Select
              id="client-status"
              value={profile.status}
              disabled={saving}
              onChange={(event) => onPatch({ status: event.target.value })}
            >
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {CLIENT_STATUS_LABEL[status]}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Journey phase" className="mt-4" htmlFor="client-phase">
            <Select
              id="client-phase"
              value={profile.current_phase}
              disabled={saving}
              onChange={(event) => onPatch({ current_phase: event.target.value })}
            >
              {PHASES.map((phase) => (
                <option key={phase.value} value={phase.value}>
                  {phase.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Assigned specialist" className="mt-4" htmlFor="client-specialist">
            <Select
              id="client-specialist"
              value={profile.assigned_specialist_id ?? ""}
              disabled={saving}
              onChange={(event) =>
                onPatch({ assigned_specialist_id: event.target.value || null })
              }
            >
              <option value="">Unassigned</option>
              {specialists.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Payment status" className="mt-4" htmlFor="client-payment">
            <Select
              id="client-payment"
              value={data.payment_status}
              disabled={saving}
              onChange={(event) => onPatch({ payment_status: event.target.value })}
            >
              {["unpaid", "paid", "partial", "overdue", "refunded"].map((status) => (
                <option key={status} value={status}>
                  {humanize(status)}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Next follow-up" className="mt-4" htmlFor="client-followup">
            <TextInput
              id="client-followup"
              type="date"
              disabled={saving}
              value={profile.next_follow_up_at ? profile.next_follow_up_at.slice(0, 10) : ""}
              onChange={(event) =>
                onPatch({
                  next_follow_up_at: event.target.value
                    ? new Date(`${event.target.value}T12:00:00Z`).toISOString()
                    : null,
                })
              }
            />
          </Field>
        </section>

        <section className="card-surface p-6">
          <h3 className="font-display text-lg font-bold text-navy-900">File details</h3>
          <dl className="mt-4 space-y-2.5 text-sm">
            <DetailRow label="Package" value={profile.package} />
            <DetailRow label="Start date" value={formatDate(profile.start_date)} />
            <DetailRow label="ZIP" value={profile.zip_code ?? "—"} />
            <DetailRow
              label="Goals"
              value={profile.goals.map((g) => humanize(g)).join(", ") || "—"}
            />
            <DetailRow
              label="Concerns"
              value={profile.concerns.map((c) => humanize(c)).join(", ") || "—"}
            />
          </dl>
        </section>

        {data.payments.length ? (
          <section className="card-surface p-6">
            <h3 className="font-display text-lg font-bold text-navy-900">Payments</h3>
            <ul className="mt-4 space-y-3">
              {data.payments.map((payment) => (
                <li
                  key={payment.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-navy-100 p-3.5"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-navy-900">
                      {formatCurrency(payment.amount_cents)}
                    </p>
                    <p className="truncate text-xs text-muted">{payment.description}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {payment.paid_at
                        ? `Paid ${formatDate(payment.paid_at)}`
                        : `Due ${formatDate(payment.due_at)}`}
                    </p>
                  </div>
                  <Badge tone={payment.status === "paid" ? "brand" : "amber"}>
                    {humanize(payment.status)}
                  </Badge>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {data.appointments.length ? (
          <section className="card-surface p-6">
            <h3 className="font-display text-lg font-bold text-navy-900">Appointments</h3>
            <ul className="mt-4 space-y-3">
              {data.appointments.map((appointment) => (
                <li key={appointment.id} className="rounded-xl border border-navy-100 p-3.5">
                  <p className="text-sm font-semibold text-navy-900">{appointment.title}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {formatDateTime(appointment.scheduled_for)} ·{" "}
                    {appointment.duration_minutes} min · {appointment.location}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}

// --- Documents -------------------------------------------------------------

function DocumentsTab({
  data,
  clientId,
  onReload,
}: {
  data: AdminClientDetail;
  clientId: string;
  onReload: () => Promise<void>;
}) {
  const toast = useToast();
  const [updating, setUpdating] = useState<string | null>(null);

  const review = async (documentId: string, status: DocumentItem["status"]) => {
    setUpdating(documentId);
    try {
      await api.patch(`/documents/${documentId}`, { status }, true);
      await onReload();
      toast.success("Document updated", "The client has been notified.");
    } catch {
      toast.error("Couldn't update that document", "Please try again.");
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
      <DocumentUploader clientId={clientId} onUploaded={() => void onReload()} />

      <section className="card-surface p-6">
        <h3 className="font-display text-lg font-bold text-navy-900">
          Documents on file ({data.documents.length})
        </h3>

        <div className="mt-5">
          <DocumentList documents={data.documents} />
        </div>

        {data.documents.length ? (
          <div className="mt-6 border-t border-navy-100 pt-5">
            <p className="text-xs font-bold uppercase tracking-wide text-muted">
              Set review status
            </p>
            <ul className="mt-3 space-y-2">
              {data.documents.map((document) => (
                <li
                  key={document.id}
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-navy-100 p-3"
                >
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-navy-800">
                    {document.filename}
                  </span>
                  <Select
                    value={document.status}
                    disabled={updating === document.id}
                    className="h-9 w-44 text-sm"
                    onChange={(event) =>
                      review(document.id, event.target.value as DocumentItem["status"])
                    }
                    aria-label={`Review status for ${document.filename}`}
                  >
                    {["received", "in_review", "reviewed", "action_needed"].map((status) => (
                      <option key={status} value={status}>
                        {humanize(status)}
                      </option>
                    ))}
                  </Select>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>
    </div>
  );
}

// --- Tasks -----------------------------------------------------------------

function TasksTab({
  data,
  clientId,
  onReload,
}: {
  data: AdminClientDetail;
  clientId: string;
  onReload: () => Promise<void>;
}) {
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [owner, setOwner] = useState("client");
  const [creating, setCreating] = useState(false);

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;
    setCreating(true);
    try {
      await api.post(
        `/admin/clients/${clientId}/tasks`,
        {
          title: title.trim(),
          description: description.trim() || null,
          due_at: dueAt ? new Date(`${dueAt}T12:00:00Z`).toISOString() : null,
          owner,
        },
        true,
      );
      setTitle("");
      setDescription("");
      setDueAt("");
      await onReload();
      toast.success("Task created", owner === "client" ? "The client was notified." : undefined);
    } catch {
      toast.error("Couldn't create that task", "Please try again.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
      <section className="card-surface p-6">
        <h3 className="font-display text-lg font-bold text-navy-900">Add a task</h3>
        <form onSubmit={create} className="mt-4 space-y-4">
          <Field label="Title" required htmlFor="task-title">
            <TextInput
              id="task-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Upload your TransUnion report"
            />
          </Field>
          <Field label="Description" htmlFor="task-description">
            <TextArea
              id="task-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="min-h-20"
              placeholder="What the client needs to do and why it matters."
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Due date" htmlFor="task-due">
              <TextInput
                id="task-due"
                type="date"
                value={dueAt}
                onChange={(event) => setDueAt(event.target.value)}
              />
            </Field>
            <Field label="Owner" htmlFor="task-owner">
              <Select
                id="task-owner"
                value={owner}
                onChange={(event) => setOwner(event.target.value)}
              >
                <option value="client">Client</option>
                <option value="creditxora">Creditxora</option>
              </Select>
            </Field>
          </div>
          <Button type="submit" loading={creating} disabled={!title.trim()}>
            <Plus className="size-4" aria-hidden />
            Create task
          </Button>
        </form>
      </section>

      <section className="card-surface p-6">
        <h3 className="font-display text-lg font-bold text-navy-900">
          Tasks ({data.tasks.length})
        </h3>
        {data.tasks.length === 0 ? (
          <EmptyState
            className="mt-5"
            icon={<ListChecks className="size-5" />}
            title="No tasks yet"
            description="Add a task to tell the client exactly what's needed next."
          />
        ) : (
          <ul className="mt-5 space-y-3">
            {data.tasks.map((task) => (
              <li key={task.id} className="rounded-xl border border-navy-100 p-4">
                <div className="flex items-start justify-between gap-3">
                  <p
                    className={clsx(
                      "text-sm font-semibold",
                      task.status === "done" ? "text-muted line-through" : "text-navy-900",
                    )}
                  >
                    {task.title}
                  </p>
                  <Badge tone={task.status === "done" ? "brand" : "amber"}>
                    {humanize(task.status)}
                  </Badge>
                </div>
                {task.description ? (
                  <p className="mt-1 text-sm leading-relaxed text-muted">{task.description}</p>
                ) : null}
                <p className="mt-2 text-xs text-muted">
                  Owner: {task.owner === "client" ? "Client" : "Creditxora"}
                  {task.due_at ? ` · due ${formatDate(task.due_at)}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

// --- Disputes --------------------------------------------------------------

function DisputesTab({
  data,
  clientId,
  onReload,
}: {
  data: AdminClientDetail;
  clientId: string;
  onReload: () => Promise<void>;
}) {
  const toast = useToast();
  const [accountName, setAccountName] = useState("");
  const [bureau, setBureau] = useState("experian");
  const [reason, setReason] = useState("");
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!accountName.trim() || !reason.trim()) return;
    setCreating(true);
    try {
      await api.post(
        `/admin/clients/${clientId}/disputes`,
        { account_name: accountName.trim(), bureau, reason: reason.trim() },
        true,
      );
      setAccountName("");
      setReason("");
      await onReload();
      toast.success("Item added to the dispute history");
    } catch {
      toast.error("Couldn't add that item", "Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const setStage = async (disputeId: string, stage: string) => {
    setUpdating(disputeId);
    try {
      await api.patch(`/admin/disputes/${disputeId}`, { stage }, true);
      await onReload();
    } catch {
      toast.error("Couldn't update that item", "Please try again.");
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
      <section className="card-surface p-6">
        <h3 className="font-display text-lg font-bold text-navy-900">Add a disputed item</h3>
        <form onSubmit={create} className="mt-4 space-y-4">
          <Field label="Account / entry" required htmlFor="dispute-account">
            <TextInput
              id="dispute-account"
              value={accountName}
              onChange={(event) => setAccountName(event.target.value)}
              placeholder="Meridian Recovery LLC"
            />
          </Field>
          <Field label="Bureau" htmlFor="dispute-bureau">
            <Select
              id="dispute-bureau"
              value={bureau}
              onChange={(event) => setBureau(event.target.value)}
            >
              <option value="experian">Experian</option>
              <option value="equifax">Equifax</option>
              <option value="transunion">TransUnion</option>
            </Select>
          </Field>
          <Field label="Reason raised" required htmlFor="dispute-reason">
            <TextArea
              id="dispute-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className="min-h-20"
              placeholder="Balance reported does not match the creditor's statement."
            />
          </Field>
          <Button
            type="submit"
            loading={creating}
            disabled={!accountName.trim() || !reason.trim()}
          >
            <Plus className="size-4" aria-hidden />
            Add item
          </Button>
        </form>

        <Alert tone="warning" className="mt-5">
          Record the process, not a promised outcome. Stages describe where an item sits
          with the bureau — never mark anything as a guaranteed removal.
        </Alert>
      </section>

      <section className="card-surface p-6">
        <h3 className="font-display text-lg font-bold text-navy-900">
          Dispute history ({data.disputes.length})
        </h3>
        {data.disputes.length === 0 ? (
          <EmptyState
            className="mt-5"
            icon={<Gavel className="size-5" />}
            title="No items yet"
            description="Items added here appear in the client's portal with their current stage."
          />
        ) : (
          <ul className="mt-5 space-y-3">
            {data.disputes.map((dispute) => (
              <li key={dispute.id} className="rounded-xl border border-navy-100 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-navy-900">
                      {dispute.account_name}
                    </p>
                    <p className="text-xs text-muted">
                      {dispute.bureau_label} · opened {formatDate(dispute.opened_at)}
                    </p>
                  </div>
                  <Badge tone={DISPUTE_STAGE_TONE[dispute.stage]}>
                    {dispute.stage_label}
                  </Badge>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted">{dispute.reason}</p>
                <Select
                  value={dispute.stage}
                  disabled={updating === dispute.id}
                  className="mt-3 h-9 text-sm"
                  onChange={(event) => setStage(dispute.id, event.target.value)}
                  aria-label={`Stage for ${dispute.account_name}`}
                >
                  {[
                    "prepared",
                    "submitted",
                    "bureau_investigating",
                    "response_received",
                    "closed",
                  ].map((stage) => (
                    <option key={stage} value={stage}>
                      {humanize(stage)}
                    </option>
                  ))}
                </Select>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

// --- Messages --------------------------------------------------------------

function MessagesTab({
  data,
  clientId,
  onReload,
}: {
  data: AdminClientDetail;
  clientId: string;
  onReload: () => Promise<void>;
}) {
  const toast = useToast();
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    const text = body.trim();
    if (!text) return;
    setSending(true);
    try {
      await api.post(`/admin/clients/${clientId}/messages`, { body: text }, true);
      setBody("");
      await onReload();
      toast.success("Message sent", "The client has been notified.");
    } catch {
      toast.error("Message not sent", "Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="card-surface mx-auto max-w-3xl">
      <div className="border-b border-navy-100 px-6 py-4">
        <h3 className="font-display text-lg font-bold text-navy-900">
          Conversation with {data.profile.first_name}
        </h3>
        <p className="text-sm text-muted">
          Messages appear in the client’s portal and trigger a notification.
        </p>
      </div>

      <div className="scroll-slim max-h-[28rem] overflow-y-auto px-6 py-5">
        {data.messages.length === 0 ? (
          <EmptyState
            icon={<MessageSquare className="size-5" />}
            title="No messages yet"
            description="Start the conversation — it stays attached to this file."
          />
        ) : (
          <ul className="space-y-4">
            {data.messages.map((message) => {
              const fromStaff = message.author_role !== "client";
              return (
                <li
                  key={message.id}
                  className={clsx("flex", fromStaff ? "justify-end" : "justify-start")}
                >
                  <div className={clsx("max-w-[85%]", fromStaff && "text-right")}>
                    <div
                      className={clsx(
                        "rounded-2xl px-4 py-3 text-sm leading-relaxed",
                        fromStaff
                          ? "rounded-br-sm bg-navy-800 text-white"
                          : "rounded-bl-sm bg-navy-50 text-navy-800",
                      )}
                    >
                      {message.body}
                    </div>
                    <p className="mt-1.5 px-1 text-[0.6875rem] text-muted">
                      {message.author_name} · {formatDateTime(message.created_at)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <form onSubmit={send} className="border-t border-navy-100 p-4">
        <TextArea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Write a message to the client…"
          className="min-h-20"
        />
        <div className="mt-3 flex justify-end">
          <Button type="submit" loading={sending} disabled={!body.trim()}>
            {!sending ? <Send className="size-4" aria-hidden /> : null}
            Send message
          </Button>
        </div>
      </form>
    </section>
  );
}

// --- Activity --------------------------------------------------------------

function ActivityTab({ data }: { data: AdminClientDetail }) {
  return (
    <section className="card-surface mx-auto max-w-3xl p-6">
      <h3 className="font-display text-lg font-bold text-navy-900">
        Communication &amp; activity history
      </h3>

      {data.activity.length === 0 ? (
        <EmptyState className="mt-5" title="No activity recorded yet" />
      ) : (
        <ol className="mt-6">
          {data.activity.map((entry, index) => (
            <li key={entry.id} className="relative flex gap-4 pb-5 last:pb-0">
              {index < data.activity.length - 1 ? (
                <span
                  className="absolute left-[0.4375rem] top-4 h-full w-px bg-navy-100"
                  aria-hidden
                />
              ) : null}
              <span
                className="relative z-10 mt-1.5 size-3.5 shrink-0 rounded-full border-2 border-white bg-brand-500 ring-1 ring-brand-200"
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-relaxed text-navy-800">{entry.summary}</p>
                <p className="mt-0.5 text-xs text-muted">
                  {entry.actor_name} · {formatDateTime(entry.created_at)} ·{" "}
                  {formatRelative(entry.created_at)}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

// --- Small helpers ---------------------------------------------------------

function HeaderStat({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  href?: string;
}) {
  const content = (
    <>
      <dt className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted">
        <Icon className="size-3.5" aria-hidden />
        {label}
      </dt>
      <dd className="mt-1 truncate text-sm font-medium text-navy-900">{value}</dd>
    </>
  );
  return href ? (
    <a href={href} className="min-w-0 transition hover:opacity-80">
      {content}
    </a>
  ) : (
    <div className="min-w-0">{content}</div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className="truncate text-right font-medium text-navy-900">{value}</dd>
    </div>
  );
}
