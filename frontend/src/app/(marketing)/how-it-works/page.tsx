import type { Metadata } from "next";
import { ArrowRight, FileText, MessageSquare, ShieldCheck, Upload } from "lucide-react";

import { PageHero } from "@/components/marketing/PageHero";
import { CtaSection, ProcessSection } from "@/components/marketing/Sections";
import { ButtonLink } from "@/components/ui/Button";
import { Alert, SectionHeading } from "@/components/ui/Primitives";

export const metadata: Metadata = {
  title: "How It Works",
  description:
    "A four-step process: assessment, credit profile review, personalised action plan, " +
    "then monitoring and credit-building guidance.",
};

const WHAT_YOU_DO = [
  {
    icon: FileText,
    title: "Complete the assessment",
    body: "Five short steps covering your details, what you're dealing with, your goal and where your credit stands today.",
  },
  {
    icon: Upload,
    title: "Upload your reports",
    body: "Your portal accepts Experian, Equifax and TransUnion reports plus supporting documents — all encrypted at rest.",
  },
  {
    icon: MessageSquare,
    title: "Approve the plan",
    body: "Nothing is submitted to a bureau until you've read the written summary and agreed to the approach.",
  },
  {
    icon: ShieldCheck,
    title: "Track every response",
    body: "Each item shows its stage and the bureau's response as it arrives, so you always know where things stand.",
  },
];

const TIMELINE = [
  { window: "Days 1–2", label: "Assessment reviewed and a specialist assigned to your file." },
  { window: "Days 3–10", label: "Reports read side by side; potential inaccuracies documented." },
  { window: "Days 10–14", label: "Written summary and prioritised action plan shared with you." },
  { window: "Days 14+", label: "Approved items raised with bureaus and furnishers." },
  { window: "30–45 days", label: "Statutory investigation window; responses logged as they arrive." },
  { window: "Ongoing", label: "Follow-up on responses and credit-building guidance alongside." },
];

export default function HowItWorksPage() {
  return (
    <>
      <PageHero
        eyebrow="How it works"
        title="A structured process, not a promise to delete everything"
        description="Creditxora follows the same four steps for every client. You see the reasoning at each stage, and you approve the plan before anything is submitted."
        breadcrumbs={[{ href: "/how-it-works", label: "How It Works" }]}
      />

      <ProcessSection detailed />

      <section className="container-page py-20 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <SectionHeading
            eyebrow="Your part"
            title="What we need from you"
            description="The process moves at the speed of the documentation. Four things are asked of you, and your portal tracks each one."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {WHAT_YOU_DO.map((item, index) => (
              <div
                key={item.title}
                className="stagger rounded-2xl border border-navy-100 bg-white p-6 shadow-soft"
                style={{ "--i": index } as React.CSSProperties}
              >
                <span className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <item.icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-4 font-display text-base font-bold text-navy-900">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-sand-50 py-20 lg:py-24">
        <div className="container-page">
          <SectionHeading
            eyebrow="Timeline"
            title="A realistic view of how long this takes"
            description="Credit bureaus generally have 30 days to investigate a dispute, and 45 in certain circumstances. Anyone promising results in a week is not describing the actual process."
            align="center"
            className="mx-auto items-center"
          />

          <ol className="mx-auto mt-12 max-w-3xl">
            {TIMELINE.map((row, index) => (
              <li key={row.window} className="relative flex gap-6 pb-8 last:pb-0">
                {index < TIMELINE.length - 1 ? (
                  <span
                    className="absolute left-[4.75rem] top-3 h-full w-px bg-navy-200 sm:left-[6.25rem]"
                    aria-hidden
                  />
                ) : null}
                <span className="w-20 shrink-0 pt-0.5 text-right font-display text-xs font-bold uppercase tracking-wide text-brand-700 sm:w-24 sm:text-sm">
                  {row.window}
                </span>
                <span
                  className="relative z-10 mt-1.5 size-2.5 shrink-0 rounded-full bg-brand-500 ring-4 ring-sand-50"
                  aria-hidden
                />
                <span className="flex-1 text-[0.9375rem] leading-relaxed text-navy-700">
                  {row.label}
                </span>
              </li>
            ))}
          </ol>

          <Alert tone="info" className="mx-auto mt-10 max-w-3xl">
            Timelines are typical, not guaranteed. Files with identity theft, mixed credit
            files or many accounts take longer, and bureau response times vary.
          </Alert>

          <div className="mt-10 flex justify-center">
            <ButtonLink href="/get-started" size="lg">
              Begin your assessment
              <ArrowRight className="size-4" aria-hidden />
            </ButtonLink>
          </div>
        </div>
      </section>

      <CtaSection />
    </>
  );
}
