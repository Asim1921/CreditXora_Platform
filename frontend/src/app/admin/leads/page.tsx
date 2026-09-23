"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, Search, Trash2, UserRoundPlus, X } from "lucide-react";

import { LeadEditDialog } from "@/components/admin/LeadEditDialog";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
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
import { useAuth } from "@/lib/auth";
import { clsx } from "@/lib/clsx";
import { formatDate, formatRelative, humanize, initials } from "@/lib/format";
import { isOverdue, useNow } from "@/lib/hooks";
import type { Lead, LeadStatus } from "@/lib/types";

const FILTERS: { value: LeadStatus | "all"; label: string }[] = [
  { value: "all", label: "All leads" },
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "assessment_completed", label: "Assessment completed" },
  { value: "consultation_booked", label: "Consultation booked" },
  { value: "converted", label: "Converted" },
  { value: "not_interested", label: "Not interested" },
];

export default function AdminLeadsPage() {
  return (
    <Suspense fallback={<LoadingPanel label="Loading leads…" />}>
      <LeadsView />
    </Suspense>
  );
}

function LeadsView() {
  const params = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const statusParam = (params.get("status") as LeadStatus | null) ?? "all";

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Lead | null>(null);
  const [deleting, setDeleting] = useState(false);

  const isAdmin = user?.role === "admin";

  // Debounce so typing doesn't fire a request per keystroke.
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (statusParam !== "all") query.set("status", statusParam);
      if (debounced) query.set("search", debounced);
      const suffix = query.toString() ? `?${query}` : "";
      setLeads(await api.get<Lead[]>(`/admin/leads${suffix}`, true));
      setError(null);
    } catch {
      setError("We couldn't load the leads. Please refresh and try again.");
    } finally {
      setLoading(false);
    }
  }, [statusParam, debounced]);

  useEffect(() => {
    void load();
  }, [load]);

  const setFilter = (value: LeadStatus | "all") => {
    router.replace(value === "all" ? "/admin/leads" : `/admin/leads?status=${value}`);
  };

  /** The PATCH returns the updated row, so the table doesn't need a refetch. */
  const applyEdit = useCallback((updated: Lead) => {
    setLeads((current) =>
      current.map((lead) => (lead.id === updated.id ? updated : lead)),
    );
  }, []);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await api.del<void>(`/admin/leads/${pendingDelete.id}`, true);
      setLeads((current) => current.filter((lead) => lead.id !== pendingDelete.id));
      toast.success(
        "Lead deleted",
        `${pendingDelete.reference} has been removed from the pipeline.`,
      );
      setPendingDelete(null);
    } catch (caught) {
      toast.error(
        "We couldn't delete that lead",
        caught instanceof ApiError ? caught.message : "Please try again.",
      );
    } finally {
      setDeleting(false);
    }
  };

  const now = useNow();
  const followUpsDue = useMemo(
    () => leads.filter((lead) => isOverdue(lead.next_follow_up_at, now)).length,
    [leads, now],
  );

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="card-surface p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-navy-400"
              aria-hidden
            />
            <TextInput
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, email, phone or reference…"
              className="h-11 pl-10 pr-10"
              aria-label="Search leads"
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-navy-400 transition hover:bg-navy-50 hover:text-navy-700"
                aria-label="Clear search"
              >
                <X className="size-3.5" />
              </button>
            ) : null}
          </div>

          <p className="shrink-0 text-sm text-muted">
            {leads.length} {leads.length === 1 ? "lead" : "leads"}
            {followUpsDue > 0 ? (
              <span className="ml-2 font-semibold text-amber-700">
                · {followUpsDue} follow-up{followUpsDue === 1 ? "" : "s"} due
              </span>
            ) : null}
          </p>
        </div>

        <div className="scroll-slim mt-3 flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setFilter(filter.value)}
              className={clsx(
                "shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold transition",
                statusParam === filter.value
                  ? "bg-navy-800 text-white"
                  : "bg-navy-50 text-navy-700 hover:bg-navy-100",
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {error ? <Alert tone="error">{error}</Alert> : null}

      {loading ? (
        <LoadingPanel label="Loading leads…" />
      ) : leads.length === 0 ? (
        <EmptyState
          icon={<UserRoundPlus className="size-5" />}
          title={debounced ? "No leads match that search" : "No leads in this stage"}
          description={
            debounced
              ? "Try a different name, email or reference number."
              : "New assessment submissions land here automatically."
          }
        />
      ) : (
        <>
          {/* Table on desktop */}
          <div className="card-surface hidden overflow-hidden lg:block">
            <table className="w-full text-left text-[0.8125rem]">
              <thead className="border-b border-navy-100 bg-navy-50/60">
                <tr>
                  {["Lead", "Contact", "Needs help with", "Status", "Assigned", "Follow-up", "Received"].map(
                    (heading) => (
                      <th
                        key={heading}
                        scope="col"
                        className="px-3 py-2 text-[0.6875rem] font-bold uppercase tracking-wide text-muted"
                      >
                        {heading}
                      </th>
                    ),
                  )}
                  <th
                    scope="col"
                    className="px-3 py-2 text-right text-[0.6875rem] font-bold uppercase tracking-wide text-muted"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-100">
                {leads.map((lead) => (
                  <tr key={lead.id} className="transition hover:bg-navy-50/50">
                    <td className="px-3 py-2">
                      <Link href={`/admin/leads/${lead.id}`} className="flex items-center gap-2.5">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-navy-800 text-[0.625rem] font-bold text-white">
                          {initials(lead.first_name, lead.last_name)}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-semibold text-navy-900">
                            {lead.first_name} {lead.last_name}
                          </span>
                          <span className="block font-mono text-[0.6875rem] text-muted">
                            {lead.reference}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-3 py-2">
                      <span className="block truncate text-navy-700">{lead.email}</span>
                      <span className="block text-[0.6875rem] text-muted">
                        {lead.phone} · {lead.state}
                      </span>
                    </td>
                    <td className="max-w-[14rem] px-3 py-2">
                      <span className="flex flex-wrap gap-1">
                        {lead.concerns.slice(0, 2).map((concern) => (
                          <Badge key={concern} tone="neutral" className={DENSE_BADGE}>
                            {humanize(concern)}
                          </Badge>
                        ))}
                        {lead.concerns.length > 2 ? (
                          <Badge tone="neutral" className={DENSE_BADGE}>
                            +{lead.concerns.length - 2}
                          </Badge>
                        ) : null}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <Badge tone={LEAD_STATUS_TONE[lead.status]} dot className={DENSE_BADGE}>
                        {LEAD_STATUS_LABEL[lead.status]}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-navy-700">
                      {lead.assigned_to_name ?? (
                        <span className="text-muted">Unassigned</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <FollowUpCell value={lead.next_follow_up_at} now={now} />
                    </td>
                    <td className="px-3 py-2 text-muted">
                      {formatRelative(lead.created_at)}
                    </td>
                    <td className="px-3 py-2">
                      <RowActions
                        lead={lead}
                        canDelete={isAdmin}
                        onEdit={() => setEditingId(lead.id)}
                        onDelete={() => setPendingDelete(lead)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cards on mobile */}
          <ul className="space-y-3 lg:hidden">
            {leads.map((lead) => (
              <li key={lead.id} className="card-surface p-4">
                <Link href={`/admin/leads/${lead.id}`} className="block">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-navy-800 text-xs font-bold text-white">
                        {initials(lead.first_name, lead.last_name)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-navy-900">
                          {lead.first_name} {lead.last_name}
                        </p>
                        <p className="truncate text-xs text-muted">{lead.email}</p>
                      </div>
                    </div>
                    <Badge tone={LEAD_STATUS_TONE[lead.status]}>
                      {LEAD_STATUS_LABEL[lead.status]}
                    </Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {lead.concerns.slice(0, 3).map((concern) => (
                      <Badge key={concern} tone="neutral">
                        {humanize(concern)}
                      </Badge>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-muted">
                    {lead.state} · {lead.reference} · {formatRelative(lead.created_at)}
                  </p>
                </Link>
                <div className="mt-3 border-t border-navy-100 pt-3">
                  <RowActions
                    lead={lead}
                    canDelete={isAdmin}
                    onEdit={() => setEditingId(lead.id)}
                    onDelete={() => setPendingDelete(lead)}
                  />
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      <LeadEditDialog
        key={editingId ?? "closed"}
        leadId={editingId}
        onClose={() => setEditingId(null)}
        onSaved={applyEdit}
      />

      <Modal
        open={pendingDelete !== null}
        onClose={deleting ? () => undefined : () => setPendingDelete(null)}
        title="Delete this lead?"
        size="sm"
        footer={
          <>
            <Button
              variant="ghost"
              size="sm"
              disabled={deleting}
              onClick={() => setPendingDelete(null)}
            >
              Cancel
            </Button>
            <Button variant="danger" size="sm" loading={deleting} onClick={confirmDelete}>
              Delete lead
            </Button>
          </>
        }
      >
        {pendingDelete ? (
          <div className="space-y-4">
            <p className="text-sm leading-relaxed text-navy-800">
              <span className="font-semibold">
                {pendingDelete.first_name} {pendingDelete.last_name}
              </span>{" "}
              <span className="font-mono text-xs text-muted">{pendingDelete.reference}</span>
              <br />
              {pendingDelete.email}
            </p>
            <Alert tone="warning">
              This removes the assessment answers, internal notes and activity history for
              good. There is no undo.
            </Alert>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

/** Tightened badge padding for the dense table. */
const DENSE_BADGE = "px-2 py-0.5 text-[0.6875rem]";

function RowActions({
  lead,
  canDelete,
  onEdit,
  onDelete,
}: {
  lead: Lead;
  canDelete: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  // A converted lead is the anchor for a client file, so the backend refuses to
  // delete it — say so here rather than after the click.
  const converted = Boolean(lead.converted_client_id);

  return (
    <div className="flex items-center justify-end gap-1">
      <button
        type="button"
        onClick={onEdit}
        title="Edit the submitted details"
        aria-label={`Edit ${lead.first_name} ${lead.last_name}`}
        className="inline-flex items-center gap-1.5 rounded-lg border border-navy-200 px-2 py-1 text-[0.6875rem] font-semibold text-navy-700 transition hover:border-navy-300 hover:bg-navy-50"
      >
        <Pencil className="size-3.5" aria-hidden />
        Edit
      </button>
      {canDelete ? (
        <button
          type="button"
          onClick={onDelete}
          disabled={converted}
          title={
            converted
              ? "Converted leads can't be deleted — work from the client file"
              : "Delete this lead"
          }
          aria-label={`Delete ${lead.first_name} ${lead.last_name}`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-2 py-1 text-[0.6875rem] font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:border-navy-100 disabled:text-navy-300 disabled:hover:bg-transparent"
        >
          <Trash2 className="size-3.5" aria-hidden />
          Delete
        </button>
      ) : null}
    </div>
  );
}

function FollowUpCell({ value, now }: { value: string | null; now: number }) {
  if (!value) return <span className="text-muted">—</span>;
  const due = isOverdue(value, now);
  return (
    <span
      className={clsx(
        "text-xs font-semibold",
        due ? "text-amber-700" : "text-navy-700",
      )}
    >
      {due ? "Due " : ""}
      {formatDate(value)}
    </span>
  );
}
