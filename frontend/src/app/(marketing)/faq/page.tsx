import type { Metadata } from "next";

import { FaqAccordion } from "@/components/marketing/FaqAccordion";
import { PageHero } from "@/components/marketing/PageHero";
import { CtaSection } from "@/components/marketing/Sections";
import { ButtonLink } from "@/components/ui/Button";
import { FAQS } from "@/lib/content";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Answers about credit repair, how Creditxora works, the bureaus we review, " +
    "timelines, documentation and cancellation.",
};

export default function FaqPage() {
  // Marking up the FAQ helps it surface as a rich result in search.
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <PageHero
        eyebrow="FAQ"
        title="Frequently asked questions"
        description="Including the question most credit-repair companies dance around — whether negative information can be guaranteed removed. It can't, and here's why."
        breadcrumbs={[{ href: "/faq", label: "FAQ" }]}
      />

      <section className="container-page py-16 lg:py-20">
        <div className="mx-auto max-w-3xl">
          <FaqAccordion items={FAQS} defaultOpen={0} />

          <div className="mt-10 rounded-2xl border border-navy-100 bg-sand-50 p-8 text-center">
            <h2 className="font-display text-xl font-bold text-navy-900">
              Still have a question?
            </h2>
            <p className="mx-auto mt-2 max-w-md text-[0.9375rem] leading-relaxed text-muted">
              Send it to us directly. A specialist will answer during business hours — no
              obligation, and no pressure to sign up.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <ButtonLink href="/contact">Contact Creditxora</ButtonLink>
              <ButtonLink href="/get-started" variant="outline">
                Start an assessment
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      <CtaSection />
    </>
  );
}
