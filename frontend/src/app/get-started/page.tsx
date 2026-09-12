import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

import { AssessmentWizard } from "@/components/assessment/AssessmentWizard";
import { Logo } from "@/components/brand/Logo";

export const metadata: Metadata = {
  title: "Get Your Credit Assessment",
  description:
    "Complete the Creditxora credit assessment in about three minutes. A specialist " +
    "reviews your request and contacts you about the next appropriate steps.",
  robots: { index: true, follow: true },
};

export default function GetStartedPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-sand-50">
      {/* Deliberately stripped-back chrome: no nav to compete with the form. */}
      <header className="border-b border-navy-100 bg-white">
        <div className="container-page flex h-16 items-center justify-between">
          <Link href="/" aria-label="Creditxora home">
            <Logo markClassName="h-8 w-8" />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition hover:text-navy-900"
          >
            <ArrowLeft className="size-4" aria-hidden />
            <span className="hidden sm:inline">Back to site</span>
            <span className="sm:hidden">Back</span>
          </Link>
        </div>
      </header>

      <main id="main" className="flex-1 py-10 lg:py-14">
        <div className="container-page max-w-3xl">
          <div className="mb-8 text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-brand-700 ring-1 ring-inset ring-brand-100">
              <ShieldCheck className="size-3.5" aria-hidden />
              Confidential credit assessment
            </span>
            <h1 className="mt-5 font-display text-3xl font-extrabold leading-tight text-navy-900 sm:text-[2.5rem]">
              Get Your Credit Assessment
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-[1.0625rem] leading-relaxed text-muted">
              Five short steps. A Creditxora specialist reviews your answers and contacts
              you about the next appropriate steps — no obligation, and no charge for the
              assessment.
            </p>
          </div>

          <AssessmentWizard />
        </div>
      </main>

      <footer className="border-t border-navy-100 bg-white py-6">
        <div className="container-page flex flex-col items-center gap-3 text-center text-xs text-muted sm:flex-row sm:justify-between sm:text-left">
          <p>© {new Date().getFullYear()} Creditxora. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/legal/privacy" className="transition hover:text-navy-800">
              Privacy Policy
            </Link>
            <Link href="/legal/disclosures" className="transition hover:text-navy-800">
              Disclosures
            </Link>
            <Link href="/contact" className="transition hover:text-navy-800">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
