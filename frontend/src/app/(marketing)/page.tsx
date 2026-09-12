import Link from "next/link";
import { ArrowRight, FileCheck2, Lock, MessagesSquare, ShieldCheck } from "lucide-react";

import { FaqAccordion } from "@/components/marketing/FaqAccordion";
import { Hero } from "@/components/marketing/Hero";
import {
  CtaSection,
  PillarsSection,
  ProcessSection,
  ServicesSection,
  StoriesSection,
} from "@/components/marketing/Sections";
import { ButtonLink } from "@/components/ui/Button";
import { Badge, SectionHeading } from "@/components/ui/Primitives";
import { FAQS, RESOURCES } from "@/lib/content";

export default function HomePage() {
  return (
    <>
      <Hero />
      <AssuranceBand />
      <ServicesSection />
      <ProcessSection />
      <PillarsSection />
      <PortalPreview />
      <StoriesSection compact />
      <ResourcesPreview />
      <FaqPreview />
      <CtaSection />
    </>
  );
}

// --- Assurance band --------------------------------------------------------

const ASSURANCES = [
  {
    icon: ShieldCheck,
    title: "No guaranteed-deletion claims",
    body: "Accurate information stays on your report. We say so before you pay anything.",
  },
  {
    icon: Lock,
    title: "Encrypted document handling",
    body: "Credit reports are encrypted at rest and never handled over email.",
  },
  {
    icon: FileCheck2,
    title: "Written plan before action",
    body: "Nothing is submitted to a bureau until you have read and approved the plan.",
  },
  {
    icon: MessagesSquare,
    title: "One assigned specialist",
    body: "The same person handles your file and answers your messages in the portal.",
  },
];

function AssuranceBand() {
  return (
    <section className="border-b border-navy-100 bg-white">
      <div className="container-page grid gap-6 py-12 sm:grid-cols-2 lg:grid-cols-4 lg:py-14">
        {ASSURANCES.map((item, index) => (
          <div
            key={item.title}
            className="stagger flex gap-3.5"
            style={{ "--i": index } as React.CSSProperties}
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <item.icon className="size-5" aria-hidden />
            </span>
            <div>
              <h3 className="font-display text-sm font-bold text-navy-900">{item.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted">{item.body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// --- Portal preview --------------------------------------------------------

const PORTAL_FEATURES = [
  "Every document you upload, encrypted and organised",
  "Each disputed item with its current stage and bureau response",
  "Tasks your specialist needs from you, with due dates",
  "Direct messages attached to your file, not scattered across texts",
  "Your journey phase, from assessment through results review",
];

function PortalPreview() {
  return (
    <section className="bg-navy-mesh bg-grid-faint relative overflow-hidden py-20 lg:py-24">
      <div className="container-page relative grid items-center gap-14 lg:grid-cols-2">
        <div>
          <SectionHeading
            theme="dark"
            eyebrow="Client portal"
            title="Track your progress instead of chasing it"
            description="Every Creditxora client gets a secure login. Your file, your documents and your bureau responses live in one place — visible to you at any hour."
          />

          <ul className="mt-8 space-y-3">
            {PORTAL_FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-3">
                <span
                  className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-400"
                  aria-hidden
                />
                <span className="text-[0.9375rem] leading-relaxed text-navy-100/85">
                  {feature}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/get-started" size="lg">
              Get Started
              <ArrowRight className="size-4" aria-hidden />
            </ButtonLink>
            <ButtonLink href="/login" size="lg" variant="onDark">
              Existing client sign in
            </ButtonLink>
          </div>
        </div>

        <JourneyVisual />
      </div>
    </section>
  );
}

const JOURNEY = [
  { label: "Assessment", note: "Completed 24 days ago", state: "complete" },
  { label: "Review", note: "Completed 20 days ago", state: "complete" },
  { label: "Action Plan", note: "Completed 13 days ago", state: "complete" },
  { label: "Dispute / Follow-up", note: "In progress", state: "current" },
  { label: "Results Review", note: "Upcoming", state: "upcoming" },
] as const;

function JourneyVisual() {
  return (
    <div className="glass-card rounded-4xl p-5">
      <div className="rounded-3xl bg-white p-6 shadow-lift">
        <div className="flex items-center justify-between">
          <p className="font-display text-base font-bold text-navy-900">
            Your Creditxora Journey
          </p>
          <Badge tone="blue" dot>
            Under review
          </Badge>
        </div>

        <ol className="mt-6 space-y-0">
          {JOURNEY.map((step, index) => (
            <li key={step.label} className="relative flex gap-4 pb-6 last:pb-0">
              {index < JOURNEY.length - 1 ? (
                <span
                  className={
                    step.state === "complete"
                      ? "absolute left-[0.6875rem] top-6 h-full w-0.5 bg-brand-500"
                      : "absolute left-[0.6875rem] top-6 h-full w-0.5 bg-navy-100"
                  }
                  aria-hidden
                />
              ) : null}
              <span
                className={
                  step.state === "complete"
                    ? "relative z-10 mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white"
                    : step.state === "current"
                      ? "relative z-10 mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-white ring-[3px] ring-brand-500"
                      : "relative z-10 mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-navy-100"
                }
                aria-hidden
              >
                {step.state === "complete" ? (
                  <svg viewBox="0 0 20 20" className="size-3.5 fill-current">
                    <path d="M7.6 13.4 4.2 10l-1.2 1.2 4.6 4.6 9-9-1.2-1.2z" />
                  </svg>
                ) : step.state === "current" ? (
                  <span className="size-2 rounded-full bg-brand-500" />
                ) : null}
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <p
                  className={
                    step.state === "upcoming"
                      ? "text-sm font-semibold text-navy-400"
                      : "text-sm font-semibold text-navy-900"
                  }
                >
                  {step.label}
                </p>
                <p className="text-xs text-muted">{step.note}</p>
              </div>
            </li>
          ))}
        </ol>

        <p className="mt-2 rounded-xl bg-navy-50/70 p-3 text-xs leading-relaxed text-muted">
          Statuses describe where your file is in the process. They never imply a
          guaranteed removal or outcome.
        </p>
      </div>
    </div>
  );
}

// --- Resources -------------------------------------------------------------

function ResourcesPreview() {
  const featured = RESOURCES.slice(0, 3);
  return (
    <section className="container-page py-20 lg:py-24">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <SectionHeading
          eyebrow="Credit resources"
          title="Understand the system you're working inside"
          description="Plain-language guides on how scoring works, how to read a report, and what actually moves the needle."
        />
        <ButtonLink href="/resources" variant="outline" className="shrink-0 self-start lg:self-auto">
          Browse all resources
          <ArrowRight className="size-4" aria-hidden />
        </ButtonLink>
      </div>

      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {featured.map((resource, index) => (
          <Link
            key={resource.slug}
            href={`/resources#${resource.slug}`}
            className="stagger group flex flex-col rounded-2xl border border-navy-100 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-lift"
            style={{ "--i": index } as React.CSSProperties}
          >
            <Badge tone="neutral" className="self-start">
              {resource.category}
            </Badge>
            <h3 className="mt-4 font-display text-lg font-bold leading-snug text-navy-900">
              {resource.title}
            </h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
              {resource.excerpt}
            </p>
            <span className="mt-5 flex items-center justify-between text-sm font-semibold text-brand-700">
              Read more
              <span className="text-xs font-medium text-muted">
                {resource.readMinutes} min read
              </span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

// --- FAQ -------------------------------------------------------------------

function FaqPreview() {
  return (
    <section className="bg-sand-50 py-20 lg:py-24">
      <div className="container-page grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
        <div>
          <SectionHeading
            eyebrow="Questions"
            title="The answers people actually want first"
            description="Including the one most credit-repair sites avoid."
          />
          <ButtonLink href="/faq" variant="outline" className="mt-8">
            See all questions
            <ArrowRight className="size-4" aria-hidden />
          </ButtonLink>
        </div>
        <FaqAccordion items={FAQS.slice(0, 5)} defaultOpen={3} />
      </div>
    </section>
  );
}
