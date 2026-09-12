"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { clsx } from "@/lib/clsx";

export type FaqItem = { question: string; answer: string };

export function FaqAccordion({
  items,
  defaultOpen = 0,
}: {
  items: readonly FaqItem[];
  defaultOpen?: number | null;
}) {
  const [open, setOpen] = useState<number | null>(defaultOpen);

  return (
    <div className="divide-y divide-navy-100 overflow-hidden rounded-2xl border border-navy-100 bg-white">
      {items.map((item, index) => {
        const expanded = open === index;
        return (
          <div key={item.question}>
            <h3>
              <button
                type="button"
                onClick={() => setOpen(expanded ? null : index)}
                aria-expanded={expanded}
                className="flex w-full items-start justify-between gap-6 px-6 py-5 text-left transition hover:bg-navy-50/60"
              >
                <span className="font-display text-[1.0625rem] font-semibold leading-snug text-navy-900">
                  {item.question}
                </span>
                <span
                  className={clsx(
                    "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg transition-all duration-300",
                    expanded
                      ? "rotate-45 bg-brand-600 text-white"
                      : "bg-navy-50 text-navy-600",
                  )}
                  aria-hidden
                >
                  <Plus className="size-4" />
                </span>
              </button>
            </h3>
            <div
              className={clsx(
                "grid transition-all duration-300 ease-out",
                expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
              )}
            >
              <div className="overflow-hidden">
                <p className="px-6 pb-6 pr-16 text-[0.9375rem] leading-relaxed text-muted">
                  {item.answer}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
