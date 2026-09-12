import Link from "next/link";
import { Mail, MessageCircle, Phone, Send } from "lucide-react";

import { Logo } from "@/components/brand/Logo";
import { SERVICES } from "@/lib/content";

const COMPANY_LINKS = [
  { href: "/about", label: "About Creditxora" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/results", label: "Success Stories" },
  { href: "/resources", label: "Credit Resources" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

const LEGAL_LINKS = [
  { href: "/legal/privacy", label: "Privacy Policy" },
  { href: "/legal/terms", label: "Terms of Service" },
  { href: "/legal/disclosures", label: "Credit Repair Disclosures" },
  { href: "/legal/consumer-rights", label: "Consumer Rights" },
  { href: "/legal/cancellation", label: "Cancellation & Refunds" },
];

export function SiteFooter() {
  return (
    <footer className="bg-navy-mesh bg-grid-faint relative overflow-hidden text-navy-100">
      <div className="container-page relative py-16 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo theme="dark" />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-navy-100/80">
              Creditxora helps U.S. consumers identify potential inaccuracies and
              questionable information on their credit reports, and provides guidance on
              taking appropriate steps to improve their credit profile.
            </p>

            <div className="mt-6 space-y-2.5 text-sm">
              <a
                href="mailto:support@creditxora.com"
                className="flex items-center gap-2.5 text-navy-100/85 transition hover:text-white"
              >
                <Mail className="size-4 text-brand-400" aria-hidden />
                support@creditxora.com
              </a>
              <a
                href="tel:+18885550137"
                className="flex items-center gap-2.5 text-navy-100/85 transition hover:text-white"
              >
                <Phone className="size-4 text-brand-400" aria-hidden />
                (888) 555-0137
              </a>
              <a
                href="https://wa.me/18885550137"
                className="flex items-center gap-2.5 text-navy-100/85 transition hover:text-white"
                rel="noopener noreferrer"
                target="_blank"
              >
                <MessageCircle className="size-4 text-brand-400" aria-hidden />
                WhatsApp
              </a>
              <a
                href="https://t.me/creditxora"
                className="flex items-center gap-2.5 text-navy-100/85 transition hover:text-white"
                rel="noopener noreferrer"
                target="_blank"
              >
                <Send className="size-4 text-brand-400" aria-hidden />
                Telegram
              </a>
            </div>

            <p className="mt-6 text-xs text-navy-200/70">
              Business hours: Monday – Friday, 9:00 AM – 6:00 PM ET
            </p>
          </div>

          <FooterColumn title="Services">
            {SERVICES.slice(0, 7).map((service) => (
              <FooterLink key={service.slug} href={`/services/${service.slug}`}>
                {service.title}
              </FooterLink>
            ))}
            <FooterLink href="/services">All services →</FooterLink>
          </FooterColumn>

          <FooterColumn title="Company">
            {COMPANY_LINKS.map((link) => (
              <FooterLink key={link.href} href={link.href}>
                {link.label}
              </FooterLink>
            ))}
            <FooterLink href="/login">Client sign in</FooterLink>
          </FooterColumn>

          <FooterColumn title="Legal">
            {LEGAL_LINKS.map((link) => (
              <FooterLink key={link.href} href={link.href}>
                {link.label}
              </FooterLink>
            ))}
          </FooterColumn>
        </div>

        <div className="mt-14 space-y-4 border-t border-white/10 pt-8">
          <p className="text-xs leading-relaxed text-navy-200/70">
            <strong className="font-semibold text-navy-100">Important disclosure.</strong>{" "}
            Creditxora provides credit report review, dispute support and credit-building
            guidance. We do not guarantee specific credit-score increases, deletions,
            approvals, or outcomes, and results vary by individual circumstances. Accurate,
            current and verifiable information cannot be removed from a credit report. You
            have the right to dispute inaccurate information with the credit bureaus
            yourself, at no cost. Creditxora is not a credit repair organization operating in
            any state where it is not authorised to do so, is not a law firm, and does not
            provide legal advice.
          </p>
          <div className="flex flex-col gap-3 pt-2 text-xs text-navy-200/70 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} Creditxora. All rights reserved.</p>
            <p className="font-medium tracking-wide text-navy-200/80">
              Building stronger credit. Creating better opportunities.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="font-display text-sm font-bold uppercase tracking-[0.14em] text-white">
        {title}
      </h3>
      <ul className="mt-4 space-y-2.5">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        className="text-sm text-navy-100/75 transition hover:text-white"
      >
        {children}
      </Link>
    </li>
  );
}
