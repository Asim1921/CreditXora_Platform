import type { Metadata } from "next";

import { PageHero } from "@/components/marketing/PageHero";
import { CtaSection, StoriesSection } from "@/components/marketing/Sections";
import { Alert, SectionHeading } from "@/components/ui/Primitives";

export const metadata: Metadata = {
  title: "Results & Success Stories",
  description:
    "Client goals, accounts reviewed and items corrected — with a clear statement " +
    "that results vary and outcomes are never guaranteed.",
};

const WHAT_WE_REPORT = [
  {
    title: "Accounts reviewed",
    body: "How many tradelines, collections, inquiries and public records were read across all three bureaus.",
  },
  {
    title: "Items corrected",
    body: "How many entries were updated or removed by the bureau or furnisher following a documented dispute.",
  },
  {
    title: "Client goal",
    body: "What the client was working toward — a mortgage, auto financing, business funding, or general improvement.",
  },
  {
    title: "Timeline",
    body: "How long the engagement ran, including bureau investigation windows and follow-up.",
  },
];

export default function ResultsPage() {
  return (
    <>
      <PageHero
        eyebrow="Results"
        title="Client success stories"
        description="We report what happened on real files: accounts reviewed, items corrected, the client's goal and how long it took. What we don't publish is a before-and-after score we can't substantiate."
        breadcrumbs={[{ href: "/results", label: "Success Stories" }]}
      />

      <StoriesSection />

      <section className="bg-sand-50 py-20 lg:py-24">
        <div className="container-page">
          <SectionHeading
            eyebrow="Our reporting standard"
            title="What we publish — and what we deliberately don't"
            description="Score figures are easy to invent and impossible for a reader to verify. These four measures describe work that actually happened on a file."
            align="center"
            className="mx-auto items-center"
          />

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {WHAT_WE_REPORT.map((item, index) => (
              <div
                key={item.title}
                className="stagger rounded-2xl border border-navy-100 bg-white p-6 shadow-soft"
                style={{ "--i": index } as React.CSSProperties}
              >
                <h3 className="font-display text-base font-bold text-navy-900">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{item.body}</p>
              </div>
            ))}
          </div>

          <Alert tone="warning" title="On before/after scores" className="mx-auto mt-10 max-w-3xl">
            We display a before-and-after score only where it is substantiated by dated
            reports the client has authorised us to reference. Where that documentation
            doesn’t exist, we publish nothing rather than an estimate. Any credit service
            showing you dramatic score jumps without substantiation is showing you
            marketing, not evidence.
          </Alert>
        </div>
      </section>

      <section className="container-page py-16 lg:py-20">
        <div className="mx-auto max-w-3xl rounded-2xl border border-navy-100 bg-white p-8 shadow-soft">
          <h2 className="font-display text-xl font-bold text-navy-900">
            Results disclaimer
          </h2>
          <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">
            Results vary by individual circumstances. Creditxora does not guarantee specific
            credit-score increases, deletions, approvals, or outcomes. Accurate, current and
            verifiable information cannot be removed from a credit report. Outcomes depend
            on what the credit bureaus and the companies that furnished the information
            determine during their investigation. Stories shown on this page describe
            individual client engagements and are not a prediction of what will happen on
            your file.
          </p>
        </div>
      </section>

      <CtaSection />
    </>
  );
}
