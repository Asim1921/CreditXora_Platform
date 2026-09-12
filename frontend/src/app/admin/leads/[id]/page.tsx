"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  CalendarClock,
  Copy,
  Mail,
  MapPin,
  Phone,
  StickyNote,
  UserRoundCheck,
} from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Field, Select, TextArea, TextInput } from "@/components/ui/Field";
import {
  Alert,
  Badge,
  EmptyState,
  LEAD_STATUS_LABEL,
  LEAD_STATUS_TONE,
  LoadingPanel,
} from "@/components/ui/Primitives";
import { useToast } from "@/components/ui/Toast";
import { ApiError, api } from "@/lib/api";
import { formatDate, formatDateTime, formatRelative, humanize, initials } from "@/lib/format";
import type { Activity, LeadDetail, LeadStatus, Specialist } from "@/lib/types";

const STATUS_OPTIONS: LeadStatus[] = [
  "new",
  "contacted",
  "assessment_completed",
  "consultation_booked",
  "converted",
  "not_interested",
];

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();

  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState("");
  const [converting, setConverting] = useState(false);
  const [packageName, setPackageName] = useState("Full Credit Profile Review");
  const [credentials, setCredentials] = useState<{
    email: string;
    password: string | null;
    clientId: string;
  } | null>(null);

  const load = useCallback(async () => {
    try {
      const [detail, log, staff] = await Promise.all([
        api.get<LeadDetail>(`/admin/leads/${id}`, true),
        api.get<Activity[]>(`/admin/leads/${id}/activity`, true),
        api.get<Specialist[]>("/admin/specialists", true),
      ]);
      setLead(detail);
      setActivity(log);
      setSpecialists(staff);
      setError(null);
    } catch (caught) {
      setError(
        caught instanceof ApiError ? caught.message : "We couldn't load this lead.",
      );
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const patch = async (changes: Record<string, unknown>) => {
    setSaving(true);
    try {
      await api.patch(`/admin/leads/${id}`, changes, true);
      await load();
      toast.success("Lead updated");
    } catch (caught) {
      toast.error(
        "Update failed",
        caught instanceof ApiError ? caught.message : "Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const addNote = async (event: React.FormEvent) => {
    event.preventDefault();
    const body = note.trim();
    if (!body) return;
    try {
      await api.post(`/admin/leads/${id}/notes`, { body }, true);
      setNote("");
      await load();
      toast.success("Note added");
    } catch {
      toast.error("Couldn't add that note", "Please try again.");
    }
  };

  const convert = async () => {
    setConverting(true);
    try {
      const result = await api.post<{
        client_id: string;
        email: string;
        temporary_password: string | null;
        message: string;
      }>(`/admin/leads/${id}/convert`, { package: packageName, send_welcome: true }, true);

      setCredentials({
        email: result.email,
        password: result.temporary_password,
        clientId: result.client_id,
      });
      await load();
      toast.success("Client file created", result.message);
    } catch (caught) {
      toast.error(
        "Conversion failed",
        caught instanceof ApiError ? caught.message : "Please try again.",
      );
    } finally {
      setConverting(false);
    }
  };

  if (error) return <Alert tone="error">{error}</Alert>;
  if (!lead) return <LoadingPanel label="Loading lead…" />;

  return (
    <div className="space-y-5">
      <Link
        href="/admin/leads"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition hover:text-navy-900"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back to leads
      </Link>

      {credentials ? (
        <Alert tone="success" title="Client portal created">
          <p>
            Share these credentials with the client through a secure channel — not email.
            They must change the password at first sign-in.
          </p>
          <dl className="mt-3 space-y-1 font-mono text-sm">
            <div className="flex gap-2">
              <dt className="text-muted">Email:</dt>
              <dd className="font-semibold">{credentials.email}</dd>
            </div>
            {credentials.password ? (
              <div className="flex items-center gap-2">
                <dt className="text-muted">Password:</dt>
                <dd className="font-semibold">{credentials.password}</dd>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(credentials.password ?? "")}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 underline"
                >
                  <Copy className="size-3" aria-hidden />
                  Copy
                </button>
              </div>
            ) : null}
          </dl>
          <Button
            className="mt-4"
            size="sm"
            onClick={() => router.push(`/admin/clients/${credentials.clientId}`)}
          >
            Open the client file
          </Button>
        </Alert>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[1.4fr_0.6fr]">
        <div className="space-y-5">
          {/* Identity */}
          <section className="card-surface p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-navy-800 text-lg font-bold text-white">
                  {initials(lead.first_name, lead.last_name)}
                </span>
                <div>
                  <h2 className="font-display text-2xl font-bold text-navy-900">
                    {lead.first_name} {lead.last_name}
                  </h2>
                  <p className="font-mono text-sm text-muted">{lead.reference}</p>
                </div>
              </div>
              <Badge tone={LEAD_STATUS_TONE[lead.status]} dot>
                {LEAD_STATUS_LABEL[lead.status]}
              </Badge>
            </div>

            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              <ContactRow icon={Mail} label="Email" value={lead.email} href={`mailto:${lead.email}`} />
              <ContactRow icon={Phone} label="Phone" value={lead.phone} href={`tel:${lead.phone.replace(/\D/g, "")}`} />
              <ContactRow icon={MapPin} label="Location" value={`${lead.state} ${lead.zip_code}`} />
              <ContactRow
                icon={CalendarClock}
                label="Submitted"
                value={`${formatDate(lead.created_at)} (${formatRelative(lead.created_at)})`}
              />
            </dl>
          </section>

          {/* Assessment answers */}
          <section className="card-surface p-6">
            <h2 className="font-display text-lg font-bold text-navy-900">
              Assessment answers
            </h2>

            <div className="mt-5 space-y-5">
              <AnswerBlock label="Needs help with">
                <div className="flex flex-wrap gap-1.5">
                  {lead.concerns.map((concern) => (
                    <Badge key={concern} tone="brand">
                      {humanize(concern)}
                    </Badge>
                  ))}
                </div>
              </AnswerBlock>

              <AnswerBlock label="Credit goals">
                <div className="flex flex-wrap gap-1.5">
                  {lead.goals.map((goal) => (
                    <Badge key={goal} tone="blue">
                      {humanize(goal)}
                    </Badge>
                  ))}
                </div>
              </AnswerBlock>

              <div className="grid gap-4 sm:grid-cols-2">
                <AnswerBlock label="Score range">
                  <p className="text-sm font-medium text-navy-900">
                    {lead.score_range ? humanize(lead.score_range).replace("_", "–") : "—"}
                  </p>
                </AnswerBlock>
                <AnswerBlock label="Bureaus involved">
                  <p className="text-sm font-medium text-navy-900">
                    {lead.bureaus.length
                      ? lead.bureaus.map((b) => humanize(b)).join(", ")
                      : "Not specified"}
                  </p>
                </AnswerBlock>
                <AnswerBlock label="Negative accounts">
                  <p className="text-sm font-medium text-navy-900">
                    {lead.negative_accounts ?? "Not specified"}
                  </p>
                </AnswerBlock>
                <AnswerBlock label="Has a recent report">
                  <p className="text-sm font-medium text-navy-900">
                    {lead.has_recent_report === null
                      ? "Not specified"
                      : lead.has_recent_report
                        ? "Yes"
                        : "No"}
                  </p>
                </AnswerBlock>
              </div>

              {lead.notes ? (
                <AnswerBlock label="What they told us">
                  <p className="rounded-xl bg-navy-50/70 p-4 text-sm italic leading-relaxed text-navy-700">
                    “{lead.notes}”
                  </p>
                </AnswerBlock>
              ) : null}

              <AnswerBlock label="Consent to contact">
                <Badge tone={lead.consent_contact ? "brand" : "red"}>
                  {lead.consent_contact ? "Given" : "Not given"}
                </Badge>
              </AnswerBlock>
            </div>
          </section>

          {/* Notes */}
          <section className="card-surface p-6">
            <h2 className="font-display text-lg font-bold text-navy-900">Internal notes</h2>
            <p className="text-sm text-muted">Visible to staff only — never to the client.</p>

            <form onSubmit={addNote} className="mt-4">
              <TextArea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Called at 2pm, left a voicemail. Following up Thursday."
                className="min-h-20"
              />
              <Button type="submit" size="sm" className="mt-3" disabled={!note.trim()}>
                <StickyNote className="size-4" aria-hidden />
                Add note
              </Button>
            </form>

            {lead.internal_notes.length === 0 ? (
              <p className="mt-5 text-sm text-muted">No notes yet.</p>
            ) : (
              <ul className="mt-5 space-y-3">
                {[...lead.internal_notes].reverse().map((entry) => (
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

        {/* Sidebar actions */}
        <div className="space-y-5">
          <section className="card-surface p-6">
            <h2 className="font-display text-lg font-bold text-navy-900">Pipeline</h2>

            <Field label="Status" className="mt-4" htmlFor="lead-status">
              <Select
                id="lead-status"
                value={lead.status}
                disabled={saving}
                onChange={(event) => patch({ status: event.target.value })}
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {LEAD_STATUS_LABEL[status]}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Assigned specialist" className="mt-4" htmlFor="lead-assignee">
              <Select
                id="lead-assignee"
                value={lead.assigned_to ?? ""}
                disabled={saving}
                onChange={(event) => patch({ assigned_to: event.target.value || null })}
              >
                <option value="">Unassigned</option>
                {specialists.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.name} ({person.role})
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Next follow-up" className="mt-4" htmlFor="lead-followup">
              <TextInput
                id="lead-followup"
                type="date"
                disabled={saving}
                value={lead.next_follow_up_at ? lead.next_follow_up_at.slice(0, 10) : ""}
                onChange={(event) =>
                  patch({
                    next_follow_up_at: event.target.value
                      ? new Date(`${event.target.value}T12:00:00Z`).toISOString()
                      : null,
                  })
                }
              />
            </Field>
          </section>

          {/* Convert */}
          <section className="card-surface p-6">
            <h2 className="font-display text-lg font-bold text-navy-900">
              Convert to client
            </h2>

            {lead.converted_client_id ? (
              <>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  This lead already has a client file.
                </p>
                <Button
                  className="mt-4 w-full"
                  onClick={() => router.push(`/admin/clients/${lead.converted_client_id}`)}
                >
                  Open the client file
                </Button>
              </>
            ) : (
              <>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  Creates a client record, opens a secure portal login and seeds their
                  onboarding checklist.
                </p>
                <Field label="Package" className="mt-4" htmlFor="package">
                  <TextInput
                    id="package"
                    value={packageName}
                    onChange={(event) => setPackageName(event.target.value)}
                  />
                </Field>
                <Button
                  className="mt-4 w-full"
                  loading={converting}
                  onClick={convert}
                  disabled={!lead.consent_contact}
                >
                  <UserRoundCheck className="size-4" aria-hidden />
                  Create client file
                </Button>
                {!lead.consent_contact ? (
                  <p className="mt-2 text-xs text-red-600">
                    This lead has not consented to contact, so a file cannot be opened.
                  </p>
                ) : null}
              </>
            )}
          </section>

          {/* Activity */}
          <section className="card-surface p-6">
            <h2 className="font-display text-lg font-bold text-navy-900">
              Activity history
            </h2>
            {activity.length === 0 ? (
              <EmptyState className="mt-4" title="No activity yet" />
            ) : (
              <ol className="mt-4 space-y-0">
                {activity.map((entry, index) => (
                  <li key={entry.id} className="relative flex gap-3 pb-4 last:pb-0">
                    {index < activity.length - 1 ? (
                      <span
                        className="absolute left-[0.3125rem] top-3 h-full w-px bg-navy-100"
                        aria-hidden
                      />
                    ) : null}
                    <span
                      className="relative z-10 mt-1.5 size-2.5 shrink-0 rounded-full bg-brand-500 ring-2 ring-white"
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm leading-relaxed text-navy-800">
                        {entry.summary}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        {entry.actor_name} · {formatRelative(entry.created_at)}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function ContactRow({
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
    <a href={href} className="min-w-0 rounded-lg transition hover:opacity-80">
      {content}
    </a>
  ) : (
    <div className="min-w-0">{content}</div>
  );
}

function AnswerBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">{label}</p>
      {children}
    </div>
  );
}
