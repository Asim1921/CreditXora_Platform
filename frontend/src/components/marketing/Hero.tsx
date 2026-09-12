import {
  ArrowRight,
  CheckCircle2,
  FileSearch,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";

import { ServiceIcon } from "@/components/marketing/ServiceIcon";
import { ButtonLink } from "@/components/ui/Button";
import { TRUST_INDICATORS } from "@/lib/content";

export function Hero() {
  return (
    <section className="bg-navy-mesh bg-grid-faint relative isolate overflow-hidden">
      {/* Soft light bloom behind the headline */}
      <div
        className="pointer-events-none absolute -left-40 top-0 size-[38rem] rounded-full bg-brand-500/12 blur-3xl"
        aria-hidden
      />
      <div className="container-page relative grid items-center gap-14 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:py-24">
        <div className="animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-brand-200 ring-1 ring-inset ring-white/15 backdrop-blur">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand-400 opacity-75" />
              <span className="relative inline-flex size-1.5 rounded-full bg-brand-400" />
            </span>
            Serving consumers in all 50 states &amp; D.C.
          </span>

          <h1 className="mt-6 font-display text-[2.5rem] font-extrabold leading-[1.06] text-white sm:text-5xl lg:text-[3.75rem]">
            Understand Your Credit.
            <span className="mt-1 block text-gradient-brand">
              Take Control of Your Financial Future.
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-navy-100/85">
            Creditxora helps consumers identify potential inaccuracies and questionable
            information on their credit reports, and provides guidance on taking
            appropriate steps to improve their credit profile.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/get-started" size="lg" className="group">
              Get Your Credit Assessment
              <ArrowRight
                className="size-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </ButtonLink>
            <ButtonLink href="/services" size="lg" variant="onDark">
              Explore Our Services
            </ButtonLink>
          </div>

          <dl className="mt-12 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
            {TRUST_INDICATORS.map((item, index) => (
              <div
                key={item.label}
                className="stagger flex flex-col gap-1.5"
                style={{ "--i": index + 3 } as React.CSSProperties}
              >
                {/* min-height keeps the four descriptions on a shared baseline
                    even when a label wraps to two lines. */}
                <dt className="flex items-start gap-2 text-sm font-bold leading-snug text-white sm:min-h-10">
                  <ServiceIcon name={item.icon} className="mt-0.5 size-4 shrink-0 text-brand-400" />
                  {item.label}
                </dt>
                <dd className="text-xs leading-relaxed text-navy-200/75">
                  {item.detail}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <HeroPanel />
      </div>

      {/* Curved transition into the page body */}
      <div
        className="absolute inset-x-0 bottom-0 h-16 bg-white [clip-path:ellipse(75%_100%_at_50%_100%)]"
        aria-hidden
      />
    </section>
  );
}

/**
 * An illustrative snapshot of the product — the review summary a client sees.
 * Static by design: it shows the shape of the work, not a promised outcome.
 */
function HeroPanel() {
  return (
    <div
      className="stagger relative lg:pl-6"
      style={{ "--i": 2 } as React.CSSProperties}
    >
      <div className="glass-card rounded-4xl p-5 shadow-[0_40px_80px_-40px_rgb(0_0_0/0.6)]">
        <div className="rounded-3xl bg-white p-6 shadow-lift">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-600">
                Credit profile review
              </p>
              <p className="mt-1 font-display text-lg font-bold text-navy-900">
                Your report summary
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 ring-1 ring-inset ring-brand-100">
              <span className="size-1.5 rounded-full bg-brand-500" aria-hidden />
              In review
            </span>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2.5">
            {[
              { label: "Experian", state: "On file" },
              { label: "Equifax", state: "On file" },
              { label: "TransUnion", state: "Requested" },
            ].map((bureau) => (
              <div
                key={bureau.label}
                className="rounded-xl border border-navy-100 bg-navy-50/50 p-3"
              >
                <p className="text-[0.6875rem] font-bold uppercase tracking-wide text-muted">
                  {bureau.label}
                </p>
                <p className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-navy-800">
                  {bureau.state === "On file" ? (
                    <CheckCircle2 className="size-3.5 text-brand-600" aria-hidden />
                  ) : (
                    <span className="size-1.5 rounded-full bg-amber-400" aria-hidden />
                  )}
                  {bureau.state}
                </p>
              </div>
            ))}
          </div>

          <ul className="mt-5 space-y-2.5">
            {[
              { icon: FileSearch, text: "21 accounts reviewed across three bureaus" },
              { icon: TrendingUp, text: "4 entries flagged as potentially inaccurate" },
              { icon: ShieldCheck, text: "Documentation prepared for your approval" },
            ].map((row) => (
              <li key={row.text} className="flex items-start gap-3">
                <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <row.icon className="size-3.5" aria-hidden />
                </span>
                <span className="text-sm leading-relaxed text-navy-700">{row.text}</span>
              </li>
            ))}
          </ul>

          <div className="mt-5 border-t border-navy-100 pt-4">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-muted">Your Creditxora journey</span>
              <span className="text-navy-800">Step 4 of 5</span>
            </div>
            <div className="mt-2.5 flex gap-1.5" aria-hidden>
              {[0, 1, 2, 3, 4].map((step) => (
                <span
                  key={step}
                  className={
                    step < 4
                      ? "h-1.5 flex-1 rounded-full bg-brand-500"
                      : "h-1.5 flex-1 rounded-full bg-navy-100"
                  }
                />
              ))}
            </div>
          </div>
        </div>

        <p className="px-2 pb-1 pt-4 text-[0.6875rem] leading-relaxed text-navy-200/70">
          Illustrative example. Results vary by individual circumstances and are never
          guaranteed.
        </p>
      </div>
    </div>
  );
}
