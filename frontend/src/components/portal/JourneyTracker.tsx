import { Check } from "lucide-react";

import { clsx } from "@/lib/clsx";
import { formatDate } from "@/lib/format";
import type { JourneyStep } from "@/lib/types";

const PHASE_EXPLANATIONS: Record<string, string> = {
  assessment: "Your assessment has been received and reviewed.",
  review: "Your reports and documents are being read side by side.",
  action_plan: "A written summary and prioritised plan is being prepared for you.",
  dispute_follow_up:
    "Approved items have been raised and we're tracking each bureau's response.",
  results_review:
    "We review what changed, what didn't, and your credit-building plan from here.",
};

/**
 * Assessment → Review → Action Plan → Dispute/Follow-up → Results Review.
 * Every label describes a stage of work, never a promised outcome.
 */
export function JourneyTracker({ journey }: { journey: JourneyStep[] }) {
  const currentIndex = journey.findIndex((step) => step.state === "current");

  return (
    <section className="card-surface p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-lg font-bold text-navy-900">
          Your Creditxora Journey
        </h2>
        <p className="text-sm text-muted">
          Phase {currentIndex + 1} of {journey.length}
        </p>
      </div>

      {/* Horizontal tracker on wide screens */}
      <ol className="mt-7 hidden md:flex">
        {journey.map((step, index) => (
          <li key={step.phase} className="relative flex-1">
            {index < journey.length - 1 ? (
              <span
                className={clsx(
                  "absolute left-1/2 top-4 h-0.5 w-full",
                  step.state === "complete" ? "bg-brand-500" : "bg-navy-100",
                )}
                aria-hidden
              />
            ) : null}
            <div className="relative flex flex-col items-center px-1 text-center">
              <span
                className={clsx(
                  "z-10 flex size-8 items-center justify-center rounded-full text-xs font-bold ring-4 ring-white",
                  step.state === "complete" && "bg-brand-500 text-white",
                  step.state === "current" &&
                    "bg-white text-brand-700 ring-[3px] ring-brand-500",
                  step.state === "upcoming" && "bg-navy-100 text-navy-400",
                )}
              >
                {step.state === "complete" ? (
                  <Check className="size-4" strokeWidth={3} aria-hidden />
                ) : (
                  index + 1
                )}
              </span>
              <span
                className={clsx(
                  "mt-2.5 text-xs font-semibold leading-tight",
                  step.state === "upcoming" ? "text-navy-400" : "text-navy-900",
                )}
              >
                {step.label}
              </span>
              <span className="mt-0.5 text-[0.6875rem] text-muted">
                {step.state === "complete"
                  ? formatDate(step.completed_at)
                  : step.state === "current"
                    ? "In progress"
                    : "Upcoming"}
              </span>
            </div>
          </li>
        ))}
      </ol>

      {/* Vertical tracker on phones */}
      <ol className="mt-6 md:hidden">
        {journey.map((step, index) => (
          <li key={step.phase} className="relative flex gap-4 pb-5 last:pb-0">
            {index < journey.length - 1 ? (
              <span
                className={clsx(
                  "absolute left-[0.9375rem] top-8 h-full w-0.5",
                  step.state === "complete" ? "bg-brand-500" : "bg-navy-100",
                )}
                aria-hidden
              />
            ) : null}
            <span
              className={clsx(
                "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                step.state === "complete" && "bg-brand-500 text-white",
                step.state === "current" && "bg-white text-brand-700 ring-[3px] ring-brand-500",
                step.state === "upcoming" && "bg-navy-100 text-navy-400",
              )}
            >
              {step.state === "complete" ? (
                <Check className="size-4" strokeWidth={3} aria-hidden />
              ) : (
                index + 1
              )}
            </span>
            <div className="min-w-0 flex-1 pt-1">
              <p
                className={clsx(
                  "text-sm font-semibold",
                  step.state === "upcoming" ? "text-navy-400" : "text-navy-900",
                )}
              >
                {step.label}
              </p>
              <p className="text-xs text-muted">
                {step.state === "complete"
                  ? `Completed ${formatDate(step.completed_at)}`
                  : step.state === "current"
                    ? "In progress"
                    : "Upcoming"}
              </p>
            </div>
          </li>
        ))}
      </ol>

      {currentIndex >= 0 ? (
        <div className="mt-6 rounded-xl bg-navy-50/70 p-4">
          <p className="text-sm font-semibold text-navy-900">
            Where you are now: {journey[currentIndex].label}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            {PHASE_EXPLANATIONS[journey[currentIndex].phase]}
          </p>
        </div>
      ) : null}
    </section>
  );
}
