"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  CreditCard,
  FileText,
  Gavel,
  ListChecks,
  MessageSquare,
  Upload,
  UserRound,
} from "lucide-react";

import { JourneyTracker } from "@/components/portal/JourneyTracker";
import { usePortal } from "@/components/portal/PortalContext";
import { ButtonLink } from "@/components/ui/Button";
import {
  Alert,
  Badge,
  CLIENT_STATUS_LABEL,
  CLIENT_STATUS_TONE,
  EmptyState,
  LoadingPanel,
} from "@/components/ui/Primitives";
import { clsx } from "@/lib/clsx";
import { formatCurrency, formatDate, formatDateTime, humanize } from "@/lib/format";

const DISPUTE_STAGE_TONE = {
  prepared: "slate",
  submitted: "blue",
  bureau_investigating: "amber",
  response_received: "violet",
  closed: "brand",
} as const;

export default function PortalDashboardPage() {
  const { dashboard, loading, error } = usePortal();

  if (loading) return <LoadingPanel label="Loading your file…" />;
  if (error || !dashboard) {
    return <Alert tone="error">{error ?? "We couldn't load your file."}</Alert>;
  }

  const { profile, journey, bureau_status, pending_tasks, recent_disputes } = dashboard;

  return (
    <div className="space-y-6">
      {/* Status strip */}
      <div className="flex flex-wrap items-center gap-3">
        <Badge tone={CLIENT_STATUS_TONE[profile.status]} dot>
          {CLIENT_STATUS_LABEL[profile.status]}
        </Badge>
        <Badge tone="neutral">{profile.phase_label}</Badge>
        {profile.assigned_specialist_name ? (
          <span className="inline-flex items-center gap-1.5 text-sm text-muted">
            <UserRound className="size-3.5" aria-hidden />
            Specialist: {profile.assigned_specialist_name}
          </span>
        ) : null}
      </div>

      {/* Stat tiles */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          icon={FileText}
          label="Documents on file"
          value={dashboard.documents_count}
          href="/portal/documents"
        />
        <StatTile
          icon={ListChecks}
          label="Open tasks"
          value={pending_tasks.length}
          href="/portal/tasks"
          highlight={pending_tasks.length > 0}
        />
        <StatTile
          icon={Gavel}
          label="Items in progress"
          value={recent_disputes.filter((d) => d.stage !== "closed").length}
          href="/portal/disputes"
        />
        <StatTile
          icon={MessageSquare}
          label="Unread messages"
          value={dashboard.unread_messages}
          href="/portal/messages"
          highlight={dashboard.unread_messages > 0}
        />
      </div>

      {/* File-level status, distinct from the phase note inside the tracker. */}
      <Alert tone="info" title={`File status: ${CLIENT_STATUS_LABEL[profile.status]}`}>
        {dashboard.status_note}
      </Alert>

      <JourneyTracker journey={journey} />

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="space-y-6">
          {/* Tasks */}
          <section className="card-surface p-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-display text-lg font-bold text-navy-900">
                Tasks for you
              </h2>
              <Link
                href="/portal/tasks"
                className="text-sm font-semibold text-brand-700 transition hover:text-brand-800"
              >
                View all
              </Link>
            </div>

            {pending_tasks.length === 0 ? (
              <EmptyState
                className="mt-5"
                icon={<CheckCircle2 className="size-5" />}
                title="Nothing needed from you right now"
                description="Your specialist will add a task here if something is required."
              />
            ) : (
              <ul className="mt-5 space-y-3">
                {pending_tasks.map((task) => (
                  <li
                    key={task.id}
                    className="flex items-start gap-3 rounded-xl border border-navy-100 p-4"
                  >
                    <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                      <ListChecks className="size-4" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-navy-900">{task.title}</p>
                      {task.description ? (
                        <p className="mt-0.5 text-sm leading-relaxed text-muted">
                          {task.description}
                        </p>
                      ) : null}
                      {task.due_at ? (
                        <p className="mt-1.5 text-xs font-medium text-amber-700">
                          Due {formatDate(task.due_at)}
                        </p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Disputes */}
          <section className="card-surface p-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-display text-lg font-bold text-navy-900">
                Recent dispute activity
              </h2>
              <Link
                href="/portal/disputes"
                className="text-sm font-semibold text-brand-700 transition hover:text-brand-800"
              >
                View all
              </Link>
            </div>

            {recent_disputes.length === 0 ? (
              <EmptyState
                className="mt-5"
                icon={<Gavel className="size-5" />}
                title="No items raised yet"
                description="Items appear here once your action plan is approved and submitted."
              />
            ) : (
              <ul className="mt-5 divide-y divide-navy-100">
                {recent_disputes.map((dispute) => (
                  <li key={dispute.id} className="flex flex-wrap gap-3 py-4 first:pt-0">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-navy-900">
                        {dispute.account_name}
                      </p>
                      <p className="mt-0.5 text-sm leading-relaxed text-muted">
                        {dispute.reason}
                      </p>
                      <p className="mt-1.5 text-xs text-muted">
                        {dispute.bureau_label} · opened {formatDate(dispute.opened_at)}
                      </p>
                    </div>
                    <Badge tone={DISPUTE_STAGE_TONE[dispute.stage]} className="h-fit">
                      {dispute.stage_label}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}

            <p className="mt-4 rounded-xl bg-navy-50/70 p-3 text-xs leading-relaxed text-muted">
              Stages describe where each item sits in the bureau’s process. They are not a
              prediction that an item will be removed.
            </p>
          </section>
        </div>

        <div className="space-y-6">
          {/* Bureau status */}
          <section className="card-surface p-6">
            <h2 className="font-display text-lg font-bold text-navy-900">Bureau status</h2>
            <ul className="mt-4 space-y-3">
              {bureau_status.map((bureau) => (
                <li
                  key={bureau.bureau}
                  className="flex items-start gap-3 rounded-xl border border-navy-100 p-3.5"
                >
                  <span
                    className={clsx(
                      "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg",
                      bureau.report_on_file
                        ? "bg-brand-50 text-brand-600"
                        : "bg-navy-50 text-navy-400",
                    )}
                  >
                    {bureau.report_on_file ? (
                      <CheckCircle2 className="size-4" aria-hidden />
                    ) : (
                      <Upload className="size-3.5" aria-hidden />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-navy-900">{bureau.label}</p>
                    <p className="text-xs leading-relaxed text-muted">{bureau.note}</p>
                  </div>
                </li>
              ))}
            </ul>
            <ButtonLink href="/portal/documents" variant="outline" className="mt-4 w-full">
              <Upload className="size-4" aria-hidden />
              Upload a report
            </ButtonLink>
          </section>

          {/* Appointment */}
          {dashboard.next_appointment ? (
            <section className="card-surface p-6">
              <h2 className="font-display text-lg font-bold text-navy-900">
                Next appointment
              </h2>
              <div className="mt-4 flex items-start gap-3 rounded-xl bg-brand-50/70 p-4">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white text-brand-600">
                  <CalendarCheck className="size-4.5" aria-hidden />
                </span>
                <div>
                  <p className="text-sm font-semibold text-navy-900">
                    {dashboard.next_appointment.title}
                  </p>
                  <p className="mt-0.5 text-sm text-muted">
                    {formatDateTime(dashboard.next_appointment.scheduled_for)}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {dashboard.next_appointment.duration_minutes} minutes ·{" "}
                    {dashboard.next_appointment.location} ·{" "}
                    {humanize(dashboard.next_appointment.status)}
                  </p>
                </div>
              </div>
            </section>
          ) : null}

          {/* Payment */}
          {dashboard.outstanding_payment ? (
            <section className="card-surface p-6">
              <h2 className="font-display text-lg font-bold text-navy-900">
                Payment due
              </h2>
              <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white text-amber-600">
                  <CreditCard className="size-4.5" aria-hidden />
                </span>
                <div>
                  <p className="text-sm font-semibold text-navy-900">
                    {formatCurrency(dashboard.outstanding_payment.amount_cents)}
                  </p>
                  <p className="mt-0.5 text-sm text-muted">
                    {dashboard.outstanding_payment.description}
                  </p>
                  <p className="mt-1 text-xs font-medium text-amber-700">
                    Due {formatDate(dashboard.outstanding_payment.due_at)}
                  </p>
                </div>
              </div>
            </section>
          ) : null}

          {/* Profile */}
          <section className="card-surface p-6">
            <h2 className="font-display text-lg font-bold text-navy-900">Your profile</h2>
            <dl className="mt-4 space-y-3 text-sm">
              {[
                { label: "Reference", value: profile.reference },
                { label: "Package", value: profile.package },
                { label: "Started", value: formatDate(profile.start_date) },
                { label: "Email", value: profile.email },
                { label: "Phone", value: profile.phone },
                { label: "State", value: profile.state },
              ].map((row) => (
                <div key={row.label} className="flex justify-between gap-4">
                  <dt className="shrink-0 text-muted">{row.label}</dt>
                  <dd className="truncate text-right font-medium text-navy-900">
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>

            {profile.goals.length ? (
              <div className="mt-5 border-t border-navy-100 pt-4">
                <p className="text-xs font-bold uppercase tracking-wide text-muted">
                  Your goals
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {profile.goals.map((goal) => (
                    <Badge key={goal} tone="brand">
                      {humanize(goal)}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}
          </section>

          <ButtonLink href="/portal/messages" className="w-full">
            Message your specialist
            <ArrowRight className="size-4" aria-hidden />
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  href,
  highlight = false,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  href: string;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={clsx(
        "group flex items-center gap-4 rounded-2xl border bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift",
        highlight ? "border-amber-200" : "border-navy-100",
      )}
    >
      <span
        className={clsx(
          "flex size-11 shrink-0 items-center justify-center rounded-xl transition-colors",
          highlight
            ? "bg-amber-50 text-amber-600"
            : "bg-navy-50 text-navy-600 group-hover:bg-brand-600 group-hover:text-white",
        )}
      >
        <Icon className="size-5" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="font-display text-2xl font-extrabold leading-none text-navy-900">
          {value}
        </p>
        <p className="mt-1 truncate text-sm text-muted">{label}</p>
      </div>
    </Link>
  );
}
