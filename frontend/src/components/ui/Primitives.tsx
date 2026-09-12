import { Loader2 } from "lucide-react";

import { clsx } from "@/lib/clsx";
import type { ClientStatus, LeadStatus } from "@/lib/types";

export function Card({
  className,
  children,
  as: Tag = "div",
}: {
  className?: string;
  children: React.ReactNode;
  as?: React.ElementType;
}) {
  return <Tag className={clsx("card-surface", className)}>{children}</Tag>;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  theme = "light",
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "left" | "center";
  theme?: "light" | "dark";
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "flex flex-col gap-3",
        align === "center" && "items-center text-center",
        className,
      )}
    >
      {eyebrow ? (
        <span
          className={clsx(
            "inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em]",
            theme === "dark" ? "text-brand-300" : "text-brand-600",
          )}
        >
          <span className="h-px w-6 bg-current opacity-60" aria-hidden />
          {eyebrow}
        </span>
      ) : null}
      <h2
        className={clsx(
          "text-3xl font-bold leading-[1.15] sm:text-4xl",
          theme === "dark" ? "text-white" : "text-navy-900",
        )}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={clsx(
            "max-w-2xl text-base leading-relaxed sm:text-lg",
            theme === "dark" ? "text-navy-100/85" : "text-muted",
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}

const BADGE_TONES = {
  neutral: "bg-navy-50 text-navy-700 ring-navy-100",
  brand: "bg-brand-50 text-brand-700 ring-brand-100",
  amber: "bg-amber-50 text-amber-700 ring-amber-100",
  red: "bg-red-50 text-red-700 ring-red-100",
  blue: "bg-sky-50 text-sky-700 ring-sky-100",
  violet: "bg-violet-50 text-violet-700 ring-violet-100",
  slate: "bg-slate-100 text-slate-600 ring-slate-200",
} as const;

export type BadgeTone = keyof typeof BADGE_TONES;

export function Badge({
  tone = "neutral",
  children,
  className,
  dot = false,
}: {
  tone?: BadgeTone;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
        BADGE_TONES[tone],
        className,
      )}
    >
      {dot ? <span className="size-1.5 rounded-full bg-current" aria-hidden /> : null}
      {children}
    </span>
  );
}

export const LEAD_STATUS_TONE: Record<LeadStatus, BadgeTone> = {
  new: "blue",
  contacted: "violet",
  assessment_completed: "amber",
  consultation_booked: "brand",
  converted: "brand",
  not_interested: "slate",
};

export const LEAD_STATUS_LABEL: Record<LeadStatus, string> = {
  new: "New lead",
  contacted: "Contacted",
  assessment_completed: "Assessment completed",
  consultation_booked: "Consultation booked",
  converted: "Converted",
  not_interested: "Not interested",
};

export const CLIENT_STATUS_TONE: Record<ClientStatus, BadgeTone> = {
  active: "brand",
  pending_documents: "amber",
  under_review: "blue",
  action_required: "red",
  follow_up_required: "violet",
  completed: "slate",
};

export const CLIENT_STATUS_LABEL: Record<ClientStatus, string> = {
  active: "Active",
  pending_documents: "Pending documents",
  under_review: "Under review",
  action_required: "Action required",
  follow_up_required: "Follow-up required",
  completed: "Completed",
};

export function Spinner({ className }: { className?: string }) {
  return (
    <Loader2
      className={clsx("size-5 animate-spin text-navy-300", className)}
      aria-label="Loading"
    />
  );
}

export function LoadingPanel({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted">
      <Spinner className="size-7" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-navy-200 bg-navy-50/40 px-6 py-14 text-center",
        className,
      )}
    >
      {icon ? (
        <div className="flex size-12 items-center justify-center rounded-2xl bg-white text-navy-400 shadow-soft">
          {icon}
        </div>
      ) : null}
      <p className="font-display text-base font-semibold text-navy-800">{title}</p>
      {description ? (
        <p className="max-w-sm text-sm text-muted">{description}</p>
      ) : null}
      {action}
    </div>
  );
}

export function Alert({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: "info" | "warning" | "success" | "error";
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const tones = {
    info: "border-sky-200 bg-sky-50 text-sky-900",
    warning: "border-amber-200 bg-amber-50 text-amber-900",
    success: "border-brand-200 bg-brand-50 text-brand-900",
    error: "border-red-200 bg-red-50 text-red-900",
  } as const;
  return (
    <div className={clsx("rounded-xl border p-4 text-sm leading-relaxed", tones[tone], className)}>
      {title ? <p className="mb-1 font-semibold">{title}</p> : null}
      {children}
    </div>
  );
}

/**
 * Compliance disclaimer. Rendered anywhere outcomes are discussed so the site
 * never implies guaranteed deletions or score increases.
 */
export function ResultsDisclaimer({
  className,
  theme = "light",
}: {
  className?: string;
  theme?: "light" | "dark";
}) {
  return (
    <p
      className={clsx(
        "text-xs leading-relaxed",
        theme === "dark" ? "text-navy-200/70" : "text-muted",
        className,
      )}
    >
      Results vary by individual circumstances. Creditxora does not guarantee specific
      credit-score increases, deletions, approvals, or outcomes.
    </p>
  );
}
