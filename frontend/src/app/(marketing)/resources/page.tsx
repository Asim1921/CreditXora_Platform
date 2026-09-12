import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, GraduationCap, Lightbulb } from "lucide-react";

import { PageHero } from "@/components/marketing/PageHero";
import { CtaSection } from "@/components/marketing/Sections";
import { ButtonLink } from "@/components/ui/Button";
import { Badge, SectionHeading } from "@/components/ui/Primitives";
import { RESOURCES, type ResourceCategory } from "@/lib/content";

export const metadata: Metadata = {
  title: "Credit Resources",
  description:
    "Credit tips, guides and financial education: how scores work, how to read a " +
    "credit report, understanding collections, charge-offs and more.",
};

const CATEGORY_META: Record<
  ResourceCategory,
  { icon: React.ElementType; blurb: string }
> = {
  "Credit Tips": {
    icon: Lightbulb,
    blurb: "Short, practical answers to the questions that come up most often.",
  },
  "Credit Guides": {
    icon: BookOpen,
    blurb: "Longer walkthroughs of how the credit system actually works.",
  },
  "Financial Education": {
    icon: GraduationCap,
    blurb: "Preparing for a specific goal — a card, a car, a home, a business.",
  },
};

const CATEGORIES: ResourceCategory[] = [
  "Credit Tips",
  "Credit Guides",
  "Financial Education",
];

export default function ResourcesPage() {
  return (
    <>
      <PageHero
        eyebrow="Credit resources"
        title="Credit education centre"
        description="Understanding how credit reporting works is the part nobody explains. These guides cover the mechanics — scoring factors, report structure, collections, charge-offs — in plain language."
        breadcrumbs={[{ href: "/resources", label: "Resources" }]}
      />

      {CATEGORIES.map((category, categoryIndex) => {
        const meta = CATEGORY_META[category];
        const articles = RESOURCES.filter((item) => item.category === category);
        const Icon = meta.icon;

        return (
          <section
            key={category}
            className={
              categoryIndex % 2 === 1
                ? "bg-sand-50 py-16 lg:py-20"
                : "bg-white py-16 lg:py-20"
            }
          >
            <div className="container-page">
              <div className="flex items-start gap-4">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand-600 text-white">
                  <Icon className="size-6" aria-hidden />
                </span>
                <SectionHeading title={category} description={meta.blurb} />
              </div>

              <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
                {articles.map((article, index) => (
                  <article
                    key={article.slug}
                    id={article.slug}
                    className="stagger flex scroll-mt-28 flex-col rounded-2xl border border-navy-100 bg-white p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-lift"
                    style={{ "--i": index } as React.CSSProperties}
                  >
                    <Badge tone="neutral" className="self-start">
                      {article.readMinutes} min read
                    </Badge>
                    <h3 className="mt-4 font-display text-[1.0625rem] font-bold leading-snug text-navy-900">
                      {article.title}
                    </h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
                      {article.excerpt}
                    </p>
                    <Link
                      href="/get-started"
                      className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 transition hover:gap-2.5"
                    >
                      Read more → Get your assessment
                      <ArrowRight className="size-3.5" aria-hidden />
                    </Link>
                  </article>
                ))}
              </div>
            </div>
          </section>
        );
      })}

      <section className="container-page py-16 lg:py-20">
        <div className="mx-auto max-w-3xl rounded-2xl border border-navy-100 bg-white p-8 text-center shadow-soft">
          <h2 className="font-display text-2xl font-bold text-navy-900">
            Get your free credit reports first
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-[0.9375rem] leading-relaxed text-muted">
            You are entitled to free copies of your credit reports from each of the three
            nationwide bureaus through AnnualCreditReport.com — the only federally
            authorised source. Creditxora does not charge you for obtaining them, and you
            never need to pay a third party for access.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <a
              href="https://www.annualcreditreport.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-navy-200 bg-white px-5 text-[0.9375rem] font-semibold text-navy-800 transition hover:bg-navy-50"
            >
              Visit AnnualCreditReport.com
            </a>
            <ButtonLink href="/get-started">Start your assessment</ButtonLink>
          </div>
        </div>
      </section>

      <CtaSection />
    </>
  );
}
