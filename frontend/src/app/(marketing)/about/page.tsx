import type { Metadata } from "next";
import { Compass, HeartHandshake, ScrollText, ShieldCheck } from "lucide-react";

import { PageHero } from "@/components/marketing/PageHero";
import { CtaSection } from "@/components/marketing/Sections";
import { Alert, SectionHeading } from "@/components/ui/Primitives";

export const metadata: Metadata = {
  title: "About Creditxora",
  description:
    "Creditxora is a U.S.-focused credit education, review, dispute-support and " +
    "credit-building platform built on transparency and compliance.",
};

const VALUES = [
  {
    icon: ScrollText,
    title: "Say what's true",
    body: "If an item is accurate and verifiable, we tell you it will stay. Setting a realistic expectation is more useful than a sales pitch you'll resent in three months.",
  },
  {
    icon: ShieldCheck,
    title: "Handle data like it matters",
    body: "Credit reports contain everything an identity thief needs. Documents are encrypted at rest, access is limited to your assigned team, and nothing sensitive moves over email.",
  },
  {
    icon: Compass,
    title: "Explain the reasoning",
    body: "Every item we raise comes with a reason you can read. You should be able to understand your own file well enough to manage it after we're done.",
  },
  {
    icon: HeartHandshake,
    title: "Build for the long term",
    body: "Reviews address what's on the report today. Credit-building guidance addresses what it looks like in two years. Both matter.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About Creditxora"
        title="A credit platform built to be the opposite of a credit sweep"
        description="Creditxora exists because the gap between “here’s what your report actually says” and “we’ll delete everything” is where most consumers get taken advantage of."
        breadcrumbs={[{ href: "/about", label: "About" }]}
      />

      <section className="container-page py-16 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
          <div className="space-y-5 text-[1.0625rem] leading-relaxed text-navy-700">
            <h2 className="font-display text-3xl font-bold text-navy-900">
              Why we built this
            </h2>
            <p>
              Most people meet their credit report at the worst possible moment — a
              mortgage pre-approval, a car loan, a business credit line — and discover
              entries they don’t recognise, balances that don’t match, and addresses
              they’ve never lived at.
            </p>
            <p>
              The industry that grew up around that moment has a deserved reputation
              problem. Guaranteed deletions. Guaranteed 800 scores. Monthly fees with
              nothing to show and no way to check what, if anything, was actually
              submitted on your behalf.
            </p>
            <p>
              Creditxora is built the other way round. A specialist reads your reports and
              tells you, in writing, what appears inaccurate and what does not. You approve
              the plan before anything is submitted. Every document, every item, every
              bureau response is visible in your portal — so “what’s happening with my
              file?” is a question you can answer yourself at 11pm.
            </p>
            <p>
              Alongside that, we teach. Understanding utilisation, payment history, inquiry
              timing and account age is what keeps a profile strong after the review work
              ends.
            </p>
          </div>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="bg-navy-mesh rounded-3xl p-8 text-white">
              <h3 className="font-display text-lg font-bold">What Creditxora is</h3>
              <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-navy-100/85">
                <li>A credit report review and dispute-support service</li>
                <li>A credit education resource for U.S. consumers</li>
                <li>A secure portal for documents, progress and communication</li>
                <li>A credit-building guidance partner over the long term</li>
              </ul>
              <h3 className="mt-7 font-display text-lg font-bold">What it is not</h3>
              <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-navy-100/85">
                <li>A law firm, and not a provider of legal advice</li>
                <li>A credit bureau or a lender</li>
                <li>A service that removes accurate information</li>
                <li>A guarantee of any score, approval or outcome</li>
              </ul>
            </div>
          </aside>
        </div>
      </section>

      <section className="bg-sand-50 py-20 lg:py-24">
        <div className="container-page">
          <SectionHeading
            eyebrow="How we work"
            title="Four commitments that shape every file"
            align="center"
            className="mx-auto items-center"
          />
          <div className="mt-12 grid gap-5 sm:grid-cols-2">
            {VALUES.map((value, index) => (
              <div
                key={value.title}
                className="stagger rounded-2xl border border-navy-100 bg-white p-7 shadow-soft"
                style={{ "--i": index } as React.CSSProperties}
              >
                <span className="flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <value.icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-4 font-display text-lg font-bold text-navy-900">
                  {value.title}
                </h3>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">
                  {value.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-16 lg:py-20">
        <Alert tone="info" title="Compliance note" className="mx-auto max-w-3xl">
          Creditxora operates as a U.S.-focused consumer credit service. Applicable federal
          and state requirements — including the Credit Repair Organizations Act and state
          registration or bonding rules — govern how services of this kind must be offered,
          disclosed and contracted. Our disclosures, service agreement and cancellation
          terms are published in full on the legal pages of this site.
        </Alert>
      </section>

      <CtaSection />
    </>
  );
}
