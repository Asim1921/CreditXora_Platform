"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Bell,
  CalendarClock,
  FileClock,
  TrendingUp,
  UserRoundPlus,
  Users,
} from "lucide-react";

import { Alert, Badge, LoadingPanel } from "@/components/ui/Primitives";
import { api } from "@/lib/api";
import { clsx } from "@/lib/clsx";
import { formatRelative } from "@/lib/format";
import type { AdminOverview, CountRow } from "@/lib/types";

const LEAD_COLORS: Record<string, string> = {
  new: "bg-sky-500",
  contacted: "bg-violet-500",
  assessment_completed: "bg-amber-500",
  consultation_booked: "bg-brand-400",
  converted: "bg-brand-600",
  not_interested: "bg-slate-400",
};

const CLIENT_COLORS: Record<string, string> = {
  active: "bg-brand-600",
  pending_documents: "bg-amber-500",
  under_review: "bg-sky-500",
  action_required: "bg-red-500",
  follow_up_required: "bg-violet-500",
  completed: "bg-slate-400",
};

export default function AdminOverviewPage() {
  const [data, setData] = useState<AdminOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<AdminOverview>("/admin/overview", true)
      .then(setData)
      .catch(() => setError("We couldn't load the dashboard. Please refresh and try again."));
  }, []);

  if (error) return <Alert tone="error">{error}</Alert>;
  if (!data) return <LoadingPanel label="Loading dashboard…" />;

  const { totals } = data;

  return (
    <div className="space-y-6">
      {/* Headline metrics */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={UserRoundPlus}
          label="Total leads"
          value={totals.leads}
          sub={`${totals.new_leads_this_week} new this week`}
          href="/admin/leads"
        />
        <MetricCard
          icon={Users}
          label="Active client files"
          value={totals.clients}
          sub={`${totals.conversion_rate}% lead conversion`}
          href="/admin/clients"
        />
        <MetricCard
          icon={FileClock}
          label="Documents awaiting review"
          value={totals.documents_awaiting_review}
          sub="Uploaded, not yet reviewed"
          href="/admin/clients"
          highlight={totals.documents_awaiting_review > 0}
        />
        <MetricCard
          icon={CalendarClock}
          label="Follow-ups due"
          value={totals.follow_ups_due}
          sub="Leads and clients past their date"
          href="/admin/leads"
          highlight={totals.follow_ups_due > 0}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <PipelinePanel
          title="Lead pipeline"
          description="New Lead → Assessment → Consultation → Converted"
          rows={data.leads}
          colors={LEAD_COLORS}
          href="/admin/leads"
          total={totals.leads}
        />
        <PipelinePanel
          title="Client files"
          description="Where every active file currently sits"
          rows={data.clients}
          colors={CLIENT_COLORS}
          href="/admin/clients"
          total={totals.clients}
        />
      </div>

      <section className="card-surface p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold text-navy-900">
              Recent activity
            </h2>
            <p className="text-sm text-muted">
              Everything that happened across leads and client files
            </p>
          </div>
          {totals.unread_notifications > 0 ? (
            <Link href="/admin/notifications">
              <Badge tone="brand" dot>
                <Bell className="size-3" aria-hidden />
                {totals.unread_notifications} unread
              </Badge>
            </Link>
          ) : null}
        </div>

        {data.recent_activity.length === 0 ? (
          <p className="mt-6 text-sm text-muted">No activity recorded yet.</p>
        ) : (
          <ul className="mt-5 space-y-0 divide-y divide-navy-100">
            {data.recent_activity.map((activity) => (
              <li key={activity.id} className="flex items-start gap-3 py-3 first:pt-0">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-500" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-relaxed text-navy-800">
                    {activity.summary}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    {activity.actor_name} · {formatRelative(activity.created_at)}
                  </p>
                </div>
                <Link
                  href={
                    activity.subject_type === "client"
                      ? `/admin/clients/${activity.subject_id}`
                      : `/admin/leads/${activity.subject_id}`
                  }
                  className="shrink-0 text-xs font-semibold text-brand-700 transition hover:text-brand-800"
                >
                  Open
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  sub,
  href,
  highlight = false,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  sub: string;
  href: string;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={clsx(
        "group rounded-2xl border bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift",
        highlight ? "border-amber-200" : "border-navy-100",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={clsx(
            "flex size-10 items-center justify-center rounded-xl transition-colors",
            highlight
              ? "bg-amber-50 text-amber-600"
              : "bg-navy-50 text-navy-600 group-hover:bg-navy-800 group-hover:text-white",
          )}
        >
          <Icon className="size-5" aria-hidden />
        </span>
        <ArrowRight
          className="size-4 text-navy-200 transition group-hover:translate-x-0.5 group-hover:text-navy-500"
          aria-hidden
        />
      </div>
      <p className="mt-4 font-display text-3xl font-extrabold leading-none text-navy-900">
        {value}
      </p>
      <p className="mt-1.5 text-sm font-semibold text-navy-800">{label}</p>
      <p className="mt-0.5 text-xs text-muted">{sub}</p>
    </Link>
  );
}

function PipelinePanel({
  title,
  description,
  rows,
  colors,
  href,
  total,
}: {
  title: string;
  description: string;
  rows: CountRow[];
  colors: Record<string, string>;
  href: string;
  total: number;
}) {
  const max = Math.max(...rows.map((row) => row.count), 1);

  return (
    <section className="card-surface p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-navy-900">{title}</h2>
          <p className="text-sm text-muted">{description}</p>
        </div>
        <Link
          href={href}
          className="shrink-0 text-sm font-semibold text-brand-700 transition hover:text-brand-800"
        >
          View all
        </Link>
      </div>

      {/* Proportional stacked bar across the whole pipeline */}
      <div className="mt-5 flex h-2 overflow-hidden rounded-full bg-navy-50">
        {rows.map((row) =>
          row.count > 0 ? (
            <span
              key={row.key}
              className={clsx("h-full", colors[row.key] ?? "bg-navy-300")}
              style={{ width: `${(row.count / Math.max(total, 1)) * 100}%` }}
              title={`${row.label}: ${row.count}`}
            />
          ) : null,
        )}
      </div>

      <ul className="mt-5 space-y-3">
        {rows.map((row) => (
          <li key={row.key}>
            <Link
              href={`${href}?status=${row.key}`}
              className="group flex items-center gap-3 rounded-lg px-1 py-1 transition hover:bg-navy-50"
            >
              <span
                className={clsx("size-2.5 shrink-0 rounded-full", colors[row.key] ?? "bg-navy-300")}
                aria-hidden
              />
              <span className="flex-1 truncate text-sm text-navy-700 group-hover:text-navy-900">
                {row.label}
              </span>
              <span className="w-24 shrink-0">
                <span className="block h-1.5 overflow-hidden rounded-full bg-navy-50">
                  <span
                    className={clsx("block h-full rounded-full", colors[row.key] ?? "bg-navy-300")}
                    style={{ width: `${(row.count / max) * 100}%` }}
                  />
                </span>
              </span>
              <span className="w-8 shrink-0 text-right font-display text-sm font-bold text-navy-900">
                {row.count}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-5 flex items-center gap-2 border-t border-navy-100 pt-4 text-xs text-muted">
        <TrendingUp className="size-3.5 text-brand-600" aria-hidden />
        Click any row to filter the table by that status.
      </div>
    </section>
  );
}
