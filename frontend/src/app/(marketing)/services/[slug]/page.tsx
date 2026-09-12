import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ArrowUpRight, Check } from "lucide-react";

import { PageHero } from "@/components/marketing/PageHero";
import { ServiceIcon } from "@/components/marketing/ServiceIcon";
import { CtaSection } from "@/components/marketing/Sections";
import { ButtonLink } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Primitives";
import { SERVICES, SERVICE_BY_SLUG, type ServiceSlug } from "@/lib/content";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return SERVICES.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const service = SERVICE_BY_SLUG.get(slug as ServiceSlug);
  if (!service) return { title: "Service not found" };
  return { title: service.title, description: service.short };
}

export default async function ServiceDetailPage({ params }: Params) {
  const { slug } = await params;
  const service = SERVICE_BY_SLUG.get(slug as ServiceSlug);
  if (!service) notFound();

  const related = SERVICES.filter((item) => item.slug !== service.slug).slice(0, 3);

  const sections = [
    { title: "What the review involves", items: service.involves },
    { title: "What information is examined", items: service.examines },
    { title: "What you receive", items: service.receives },
  ];

  return (
    <>
      <PageHero
        eyebrow="Service"
        title={service.title}
        description={service.short}
        breadcrumbs={[
          { href: "/services", label: "Services" },
          { href: `/services/${service.slug}`, label: service.title },
        ]}
      >
        <ButtonLink href="/get-started" size="lg">
          Request a Credit Review
          <ArrowRight className="size-4" aria-hidden />
        </ButtonLink>
      </PageHero>

      <section className="container-page py-16 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.25fr_0.75fr] lg:gap-16">
          <div className="space-y-12">
            {sections.map((section) => (
              <div key={section.title}>
                <h2 className="font-display text-2xl font-bold text-navy-900">
                  {section.title}
                </h2>
                <ul className="mt-5 space-y-3">
                  {section.items.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                        <Check className="size-3" strokeWidth={3} aria-hidden />
                      </span>
                      <span className="text-[0.9375rem] leading-relaxed text-navy-700">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div>
              <h2 className="font-display text-2xl font-bold text-navy-900">
                What happens afterward
              </h2>
              <p className="mt-4 text-[0.9375rem] leading-relaxed text-navy-700">
                {service.afterward}
              </p>
            </div>

            <Alert tone="warning" title="What this service is not">
              Creditxora cannot remove accurate, current and verifiable information from a
              credit report, and does not guarantee any specific score change, deletion or
              approval. You also have the right to dispute inaccurate information with the
              credit bureaus yourself, at no cost.
            </Alert>
          </div>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="card-surface p-6">
              <span className="flex size-12 items-center justify-center rounded-xl bg-brand-600 text-white">
                <ServiceIcon name={service.icon} className="size-6" />
              </span>
              <h2 className="mt-4 font-display text-lg font-bold text-navy-900">
                Request this review
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Complete the assessment and select “{service.title}”. A specialist will
                review your request and contact you regarding next steps.
              </p>
              <ButtonLink href="/get-started" className="mt-5 w-full">
                Request a Credit Review
              </ButtonLink>
              <ButtonLink href="/contact" variant="outline" className="mt-2 w-full">
                Ask a question first
              </ButtonLink>

              <dl className="mt-6 space-y-3 border-t border-navy-100 pt-5 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Bureaus covered</dt>
                  <dd className="font-semibold text-navy-800">All three</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Assessment time</dt>
                  <dd className="font-semibold text-navy-800">~3 minutes</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Availability</dt>
                  <dd className="font-semibold text-navy-800">50 states &amp; D.C.</dd>
                </div>
              </dl>
            </div>

            <div className="card-surface mt-5 p-6">
              <h3 className="font-display text-sm font-bold uppercase tracking-wide text-navy-900">
                Related services
              </h3>
              <ul className="mt-4 space-y-1">
                {related.map((item) => (
                  <li key={item.slug}>
                    <Link
                      href={`/services/${item.slug}`}
                      className="group flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-navy-700 transition hover:bg-navy-50"
                    >
                      {item.title}
                      <ArrowUpRight
                        className="size-3.5 shrink-0 text-navy-300 transition group-hover:text-brand-600"
                        aria-hidden
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </section>

      <CtaSection />
    </>
  );
}
