"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { FileText, ListChecks, Search, Users, X } from "lucide-react";

import { TextInput } from "@/components/ui/Field";
import {
  Alert,
  Badge,
  CLIENT_STATUS_LABEL,
  CLIENT_STATUS_TONE,
  EmptyState,
  LoadingPanel,
} from "@/components/ui/Primitives";
import { api } from "@/lib/api";
import { clsx } from "@/lib/clsx";
import { formatDate, humanize, initials } from "@/lib/format";
import { isOverdue, useNow } from "@/lib/hooks";
import type { ClientStatus, ClientSummary } from "@/lib/types";

const FILTERS: { value: ClientStatus | "all"; label: string }[] = [
  { value: "all", label: "All clients" },
  { value: "active", label: "Active" },
  { value: "pending_documents", label: "Pending documents" },
  { value: "under_review", label: "Under review" },
  { value: "action_required", label: "Action required" },
  { value: "follow_up_required", label: "Follow-up required" },
  { value: "completed", label: "Completed" },
];

export default function AdminClientsPage() {
  return (
    <Suspense fallback={<LoadingPanel label="Loading clients…" />}>
      <ClientsView />
    </Suspense>
  );
}

function ClientsView() {
  const params = useSearchParams();
  const router = useRouter();
  const statusParam = (params.get("status") as ClientStatus | null) ?? "all";

  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const now = useNow();

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
      setClients(await api.get<ClientSummary[]>(`/admin/clients${suffix}`, true));
      setError(null);
    } catch {
      setError("We couldn't load the client list. Please refresh and try again.");
    } finally {
      setLoading(false);
    }
  }, [statusParam, debounced]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-5">
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
              placeholder="Search clients by name, email, phone or reference…"
              className="h-11 pl-10 pr-10"
              aria-label="Search clients"
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-navy-400 transition hover:bg-navy-50"
                aria-label="Clear search"
              >
                <X className="size-3.5" />
              </button>
            ) : null}
          </div>
          <p className="shrink-0 text-sm text-muted">
            {clients.length} {clients.length === 1 ? "client" : "clients"}
          </p>
        </div>

        <div className="scroll-slim mt-3 flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() =>
                router.replace(
                  filter.value === "all"
                    ? "/admin/clients"
                    : `/admin/clients?status=${filter.value}`,
                )
              }
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
        <LoadingPanel label="Loading clients…" />
      ) : clients.length === 0 ? (
        <EmptyState
          icon={<Users className="size-5" />}
          title={debounced ? "No clients match that search" : "No clients in this stage"}
          description="Client files are created by converting a lead from the leads table."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {clients.map((client) => (
            <Link
              key={client.id}
              href={`/admin/clients/${client.id}`}
              className="card-surface group flex flex-col p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-navy-800 text-sm font-bold text-white">
                    {initials(client.first_name, client.last_name)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-display text-base font-bold text-navy-900">
                      {client.first_name} {client.last_name}
                    </p>
                    <p className="truncate font-mono text-xs text-muted">
                      {client.reference}
                    </p>
                  </div>
                </div>
                <Badge tone={CLIENT_STATUS_TONE[client.status]} dot>
                  {CLIENT_STATUS_LABEL[client.status]}
                </Badge>
              </div>

              <dl className="mt-4 space-y-1.5 text-sm">
                <Row label="Package" value={client.package} />
                <Row label="Phase" value={client.phase_label} />
                <Row
                  label="Specialist"
                  value={client.assigned_specialist_name ?? "Unassigned"}
                />
                <Row label="Started" value={formatDate(client.start_date)} />
                <Row label="Payment" value={humanize(client.payment_status)} />
              </dl>

              <div className="mt-4 flex items-center gap-3 border-t border-navy-100 pt-3 text-xs text-muted">
                <span className="inline-flex items-center gap-1">
                  <FileText className="size-3.5" aria-hidden />
                  {client.documents_count} docs
                </span>
                <span className="inline-flex items-center gap-1">
                  <ListChecks className="size-3.5" aria-hidden />
                  {client.open_tasks} open tasks
                </span>
                {client.next_follow_up_at ? (
                  <span
                    className={clsx(
                      "ml-auto font-semibold",
                      isOverdue(client.next_follow_up_at, now)
                        ? "text-amber-700"
                        : "text-muted",
                    )}
                  >
                    Follow-up {formatDate(client.next_follow_up_at)}
                  </span>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className="truncate text-right font-medium text-navy-900">{value}</dd>
    </div>
  );
}
