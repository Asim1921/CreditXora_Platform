"use client";

import { useEffect, useState } from "react";
import { Gavel } from "lucide-react";

import { Alert, Badge, EmptyState, LoadingPanel, type BadgeTone } from "@/components/ui/Primitives";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { DisputeItem } from "@/lib/types";

const STAGE_TONE: Record<DisputeItem["stage"], BadgeTone> = {
  prepared: "slate",
  submitted: "blue",
  bureau_investigating: "amber",
  response_received: "violet",
  closed: "brand",
};

const STAGES: { key: DisputeItem["stage"]; label: string }[] = [
  { key: "prepared", label: "Prepared" },
  { key: "submitted", label: "Submitted" },
  { key: "bureau_investigating", label: "Investigating" },
  { key: "response_received", label: "Response received" },
  { key: "closed", label: "Closed" },
];

export default function PortalDisputesPage() {
  const [disputes, setDisputes] = useState<DisputeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<DisputeItem[]>("/portal/disputes", true)
      .then(setDisputes)
      .catch(() => setError("We couldn't load your dispute history. Please refresh."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingPanel label="Loading dispute history…" />;
  if (error) return <Alert tone="error">{error}</Alert>;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Alert tone="info" title="How to read this page">
        Each item below is something we raised with a bureau on your behalf, and the stage
        shows where it sits in that bureau’s process. A stage is not a prediction — the
        bureau decides the outcome after its investigation.
      </Alert>

      <section className="card-surface p-6">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-display text-lg font-bold text-navy-900">Dispute history</h2>
          <p className="text-sm text-muted">
            {disputes.length} {disputes.length === 1 ? "item" : "items"}
          </p>
        </div>

        {disputes.length === 0 ? (
          <EmptyState
            className="mt-5"
            icon={<Gavel className="size-5" />}
            title="No items raised yet"
            description="Once your action plan is agreed, each item we raise appears here with its current stage."
          />
        ) : (
          <ul className="mt-6 space-y-4">
            {disputes.map((dispute) => (
              <li
                key={dispute.id}
                className="rounded-2xl border border-navy-100 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-display text-base font-bold text-navy-900">
                      {dispute.account_name}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      {dispute.bureau_label} · opened {formatDate(dispute.opened_at)}
                      {dispute.last_update_at
                        ? ` · updated ${formatDate(dispute.last_update_at)}`
                        : ""}
                    </p>
                  </div>
                  <Badge tone={STAGE_TONE[dispute.stage]} dot>
                    {dispute.stage_label}
                  </Badge>
                </div>

                <p className="mt-3 text-sm leading-relaxed text-navy-700">
                  <span className="font-semibold">Reason raised: </span>
                  {dispute.reason}
                </p>

                <StageTrack current={dispute.stage} />

                {dispute.outcome_note ? (
                  <p className="mt-4 rounded-xl bg-navy-50/70 p-3 text-sm leading-relaxed text-muted">
                    <span className="font-semibold text-navy-800">Latest update: </span>
                    {dispute.outcome_note}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StageTrack({ current }: { current: DisputeItem["stage"] }) {
  const currentIndex = STAGES.findIndex((stage) => stage.key === current);

  return (
    <ol className="mt-5 flex gap-1.5" aria-label="Dispute stage">
      {STAGES.map((stage, index) => (
        <li key={stage.key} className="flex-1">
          <span
            className={
              index <= currentIndex
                ? "block h-1.5 rounded-full bg-brand-500"
                : "block h-1.5 rounded-full bg-navy-100"
            }
            aria-hidden
          />
          <span
            className={
              index === currentIndex
                ? "mt-1.5 block text-[0.625rem] font-bold uppercase tracking-wide text-brand-700"
                : "mt-1.5 block text-[0.625rem] font-medium uppercase tracking-wide text-navy-300"
            }
          >
            {stage.label}
          </span>
        </li>
      ))}
    </ol>
  );
}
