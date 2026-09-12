import type { Metadata } from "next";

import { PageHero } from "@/components/marketing/PageHero";
import { CtaSection, ServiceCard } from "@/components/marketing/Sections";
import { SectionHeading } from "@/components/ui/Primitives";
import { SERVICES } from "@/lib/content";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Twelve focused credit reviews — from full report review and collections to " +
    "identity theft assistance and credit-building guidance.",
};

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="Services"
        title="Focused reviews, matched to what's actually on your reports"
        description="Every service below describes a specific review we carry out and what you receive at the end of it. Most clients begin with a full credit report review, then narrow to the areas that matter for their goal."
        breadcrumbs={[{ href: "/services", label: "Services" }]}
      />

      <section className="container-page py-16 lg:py-20">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((service, index) => (
            <ServiceCard key={service.slug} service={service} index={index} />
          ))}
        </div>
      </section>

      <section className="bg-sand-50 py-16 lg:py-20">
        <div className="container-page">
          <SectionHeading
            eyebrow="Not sure where to start?"
            title="Choose “Full review” and we'll tell you what we find"
            description="You don't need to diagnose your own credit file. The assessment has a “Not sure / full review” option — a specialist reads all three reports and comes back with a written summary and a prioritised plan."
            align="center"
            className="mx-auto items-center"
          />
        </div>
      </section>

      <CtaSection
        title="Start with a credit assessment"
        description="Tell us what you're dealing with and what you're working toward. A Creditxora representative will review your request and contact you regarding the next appropriate steps."
      />
    </>
  );
}
