import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHero } from "@/components/marketing/PageHero";
import { Alert } from "@/components/ui/Primitives";
import { clsx } from "@/lib/clsx";
import { LEGAL_BY_SLUG, LEGAL_DOCUMENTS } from "@/lib/legal";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return LEGAL_DOCUMENTS.map((doc) => ({ slug: doc.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const doc = LEGAL_BY_SLUG.get(slug);
  if (!doc) return { title: "Not found" };
  return { title: doc.title, description: doc.summary };
}

export default async function LegalPage({ params }: Params) {
  const { slug } = await params;
  const doc = LEGAL_BY_SLUG.get(slug);
  if (!doc) notFound();

  return (
    <>
      <PageHero
        eyebrow="Legal"
        title={doc.title}
        description={doc.summary}
        breadcrumbs={[{ href: `/legal/${doc.slug}`, label: doc.title }]}
      />

      <section className="container-page py-16 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.28fr_0.72fr] lg:gap-14">
          <nav aria-label="Legal documents" className="lg:sticky lg:top-28 lg:self-start">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">
              Legal &amp; compliance
            </p>
            <ul className="mt-4 space-y-1">
              {LEGAL_DOCUMENTS.map((item) => (
                <li key={item.slug}>
                  <Link
                    href={`/legal/${item.slug}`}
                    className={clsx(
                      "block rounded-xl px-3 py-2.5 text-sm font-medium transition",
                      item.slug === doc.slug
                        ? "bg-brand-50 text-brand-700"
                        : "text-navy-700 hover:bg-navy-50",
                    )}
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-6 px-3 text-xs text-muted">Last updated {doc.updated}</p>
          </nav>

          <article className="max-w-3xl">
            <Alert tone="warning" title="Draft pending attorney review">
              This document reflects how the Creditxora platform currently operates. It has
              not yet been reviewed by a licensed U.S. attorney. Before launch, these
              documents and the underlying business model should be reviewed against
              applicable federal requirements and the requirements of every state in which
              services are offered.
            </Alert>

            <div className="mt-10 space-y-10">
              {doc.sections.map((section) => (
                <section key={section.heading}>
                  <h2 className="font-display text-xl font-bold text-navy-900">
                    {section.heading}
                  </h2>
                  <div className="mt-3 space-y-3">
                    {section.body.map((paragraph) => (
                      <p
                        key={paragraph.slice(0, 48)}
                        className="text-[0.9375rem] leading-relaxed text-navy-700"
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </section>
              ))}
            </div>

            <div className="mt-12 rounded-2xl border border-navy-100 bg-sand-50 p-6">
              <h2 className="font-display text-base font-bold text-navy-900">
                Questions about this document?
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Contact Creditxora at{" "}
                <a
                  href="mailto:legal@creditxora.com"
                  className="font-semibold text-brand-700 underline underline-offset-2"
                >
                  legal@creditxora.com
                </a>{" "}
                or write to us using the details on the{" "}
                <Link
                  href="/contact"
                  className="font-semibold text-brand-700 underline underline-offset-2"
                >
                  contact page
                </Link>
                .
              </p>
            </div>
          </article>
        </div>
      </section>
    </>
  );
}
