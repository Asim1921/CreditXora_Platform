import Link from "next/link";
import { ArrowRight, ArrowUpRight, Quote } from "lucide-react";

import { ServiceIcon } from "@/components/marketing/ServiceIcon";
import { ButtonLink } from "@/components/ui/Button";
import { Badge, ResultsDisclaimer, SectionHeading } from "@/components/ui/Primitives";
import { clsx } from "@/lib/clsx";
import { PROCESS_STEPS, SERVICES, SUCCESS_STORIES, type Service } from "@/lib/content";

// --- Services --------------------------------------------------------------

export function ServiceCard({ service, index = 0 }: { service: Service; index?: number }) {
  return (
    <Link
      href={`/services/${service.slug}`}
      className="stagger group relative flex flex-col gap-3 rounded-2xl border border-navy-100 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-lift"
      style={{ "--i": index } as React.CSSProperties}
    >
      <span className="flex size-11 items-center justify-center rounded-xl bg-navy-50 text-navy-700 transition-colors duration-300 group-hover:bg-brand-600 group-hover:text-white">
        <ServiceIcon name={service.icon} />
      </span>
      <h3 className="font-display text-[1.0625rem] font-bold leading-snug text-navy-900">
        {service.title}
      </h3>
      <p className="flex-1 text-sm leading-relaxed text-muted">{service.short}</p>
      <span className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-brand-700">
        Learn more
        <ArrowUpRight
          className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          aria-hidden
        />
      </span>
    </Link>
  );
}

export function ServicesSection({
  limit,
  eyebrow = "What we review",
  title = "Twelve focused reviews, one clear picture",
  description = "Each review targets a specific part of your credit file. Most clients start with a full report review and we narrow from there.",
}: {
  limit?: number;
  eyebrow?: string;
  title?: string;
  description?: string;
}) {
  const services = limit ? SERVICES.slice(0, limit) : SERVICES;

  return (
    <section className="container-page py-20 lg:py-24">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <SectionHeading eyebrow={eyebrow} title={title} description={description} />
        <ButtonLink href="/services" variant="outline" className="shrink-0 self-start lg:self-auto">
          View all services
          <ArrowRight className="size-4" aria-hidden />
        </ButtonLink>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {services.map((service, index) => (
          <ServiceCard key={service.slug} service={service} index={index} />
        ))}
      </div>
    </section>
  );
}

// --- Process ---------------------------------------------------------------

export function ProcessSection({ detailed = false }: { detailed?: boolean }) {
  return (
    <section className="bg-sand-50 py-20 lg:py-24">
      <div className="container-page">
        <SectionHeading
          eyebrow="How it works"
          title="A clear, four-step process"
          description="No vague promises about deleting everything. A structured review, a plan you approve, and visible progress at every stage."
          align="center"
          className="mx-auto items-center"
        />

        <ol className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {PROCESS_STEPS.map((step, index) => (
            <li
              key={step.number}
              className="stagger relative flex flex-col rounded-2xl border border-navy-100 bg-white p-6 shadow-soft"
              style={{ "--i": index } as React.CSSProperties}
            >
              {/* Connector between cards on wide screens */}
              {index < PROCESS_STEPS.length - 1 ? (
                <span
                  className="absolute -right-3 top-12 hidden h-px w-6 bg-navy-200 lg:block"
                  aria-hidden
                />
              ) : null}
              <span className="font-display text-3xl font-extrabold text-brand-500/25">
                {step.number}
              </span>
              <h3 className="mt-2 font-display text-lg font-bold text-navy-900">
                {step.title}
              </h3>
              <p className="mt-1.5 text-sm font-medium text-navy-700">{step.description}</p>
              {detailed ? (
                <p className="mt-3 text-sm leading-relaxed text-muted">{step.detail}</p>
              ) : null}
            </li>
          ))}
        </ol>

        <div className="mt-10 flex justify-center">
          <ButtonLink href="/get-started" size="lg">
            Start step one — it takes 3 minutes
            <ArrowRight className="size-4" aria-hidden />
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}

// --- Differentiators -------------------------------------------------------

const PILLARS = [
  {
    title: "Transparency over promises",
    body:
      "We tell you what we found, what can reasonably be questioned, and what cannot. Accurate information stays — and we say so up front.",
  },
  {
    title: "Your file, not a template",
    body:
      "Reviews are done by an assigned specialist against your actual reports and documents, not run through a generic dispute mill.",
  },
  {
    title: "Everything in one place",
    body:
      "Documents, disputes, bureau responses, tasks and messages all live in your portal — no more chasing status by text message.",
  },
  {
    title: "Security by default",
    body:
      "Credit reports are encrypted at rest, access is restricted to your assigned team, and nothing sensitive travels over email.",
  },
];

export function PillarsSection() {
  return (
    <section className="container-page py-20 lg:py-24">
      <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <SectionHeading
          eyebrow="Why Creditxora"
          title="Built to look — and behave — like a legitimate credit platform"
          description="The credit-repair industry has a reputation problem for good reason. Creditxora is structured to be the opposite of a credit-sweep operation."
        />

        <div className="grid gap-4 sm:grid-cols-2">
          {PILLARS.map((pillar, index) => (
            <div
              key={pillar.title}
              className="stagger rounded-2xl border border-navy-100 bg-white p-6 shadow-soft"
              style={{ "--i": index } as React.CSSProperties}
            >
              <h3 className="font-display text-base font-bold text-navy-900">
                {pillar.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{pillar.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// --- Success stories -------------------------------------------------------

export function StoriesSection({ compact = false }: { compact?: boolean }) {
  return (
    <section className={clsx("py-20 lg:py-24", compact ? "bg-sand-50" : "bg-white")}>
      <div className="container-page">
        <SectionHeading
          eyebrow="Client success stories"
          title="What working with Creditxora actually looks like"
          description="Real client goals and documented review work. Every figure below describes activity on a file — never a promised score change."
          align="center"
          className="mx-auto items-center"
        />

        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {SUCCESS_STORIES.map((story, index) => (
            <figure
              key={story.name}
              className="stagger flex flex-col rounded-2xl border border-navy-100 bg-white p-7 shadow-soft"
              style={{ "--i": index } as React.CSSProperties}
            >
              <Quote className="size-7 text-brand-200" aria-hidden />
              <blockquote className="mt-4 flex-1 text-[0.9375rem] leading-relaxed text-navy-800">
                “{story.quote}”
              </blockquote>

              <figcaption className="mt-6 border-t border-navy-100 pt-5">
                <p className="font-display text-sm font-bold text-navy-900">
                  {story.name}
                </p>
                <p className="text-xs text-muted">{story.location}</p>

                <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
                  {[
                    { label: "Reviewed", value: story.accountsReviewed },
                    { label: "Corrected", value: story.itemsCorrected },
                    { label: "Timeline", value: story.timeline },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-xl bg-navy-50/70 px-2 py-2.5">
                      <dt className="text-[0.625rem] font-bold uppercase tracking-wide text-muted">
                        {stat.label}
                      </dt>
                      <dd className="mt-0.5 font-display text-sm font-bold text-navy-900">
                        {stat.value}
                      </dd>
                    </div>
                  ))}
                </dl>

                <Badge tone="brand" className="mt-4">
                  Goal: {story.goal}
                </Badge>
              </figcaption>
            </figure>
          ))}
        </div>

        <ResultsDisclaimer className="mx-auto mt-8 max-w-2xl text-center" />
      </div>
    </section>
  );
}

// --- Closing CTA -----------------------------------------------------------

export function CtaSection({
  title = "Ready to see what's actually on your reports?",
  description = "Complete the assessment and a Creditxora specialist will review your request and contact you regarding the next appropriate steps.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <section className="container-page py-16 lg:py-20">
      <div className="bg-navy-mesh bg-grid-faint relative overflow-hidden rounded-4xl px-7 py-14 text-center sm:px-14 lg:py-20">
        <div className="relative mx-auto max-w-2xl">
          <h2 className="font-display text-3xl font-extrabold leading-tight text-white sm:text-4xl">
            {title}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-navy-100/85 sm:text-lg">
            {description}
          </p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink href="/get-started" size="lg" className="group">
              Get Your Credit Assessment
              <ArrowRight
                className="size-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </ButtonLink>
            <ButtonLink href="/contact" size="lg" variant="onDark">
              Talk to a specialist
            </ButtonLink>
          </div>
          <p className="mt-6 text-xs text-navy-200/70">
            No obligation. Your information is kept confidential and is never sold.
          </p>
        </div>
      </div>
    </section>
  );
}
