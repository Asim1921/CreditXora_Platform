import Link from "next/link";
import { Mail, MessageCircle, Phone, Send } from "lucide-react";

import { Logo } from "@/components/brand/Logo";
import { SERVICES, SOCIAL_LINKS, type SocialKey } from "@/lib/content";

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

            <div className="mt-6 flex items-center gap-3">
              {SOCIAL_LINKS.map((social) => {
                const Icon = SOCIAL_ICONS[social.key];
                return (
                  <a
                    key={social.key}
                    href={social.href}
                    aria-label={`Creditxora on ${social.label}`}
                    title={social.label}
                    className="flex size-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-navy-100/85 transition hover:border-brand-400/60 hover:bg-brand-400/15 hover:text-white"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <Icon className="size-4" aria-hidden />
                  </a>
                );
              })}
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
            <FooterLink href="/signup">Create an account</FooterLink>
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

type IconProps = React.SVGProps<SVGSVGElement>;

// Brand marks are not part of the lucide icon set, so they ship as inline paths.
const SOCIAL_ICONS: Record<SocialKey, (props: IconProps) => React.ReactElement> = {
  tiktok: (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5 2.59 2.59 0 1 1 .76-5.07v-3.1a5.66 5.66 0 0 0-.76-.05A5.68 5.68 0 1 0 15.54 15.4V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3a4.28 4.28 0 0 1-3.24-1.48Z" />
    </svg>
  ),
  instagram: (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.8 3.8 0 0 1-1.38-.9 3.8 3.8 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16Zm0 2.12c-3.15 0-3.5.01-4.74.07-1.14.05-1.76.24-2.18.4-.55.22-.94.47-1.35.88-.41.41-.66.8-.88 1.35-.16.42-.35 1.04-.4 2.18-.06 1.24-.07 1.59-.07 4.74s.01 3.5.07 4.74c.05 1.14.24 1.76.4 2.18.22.55.47.94.88 1.35.41.41.8.66 1.35.88.42.16 1.04.35 2.18.4 1.24.06 1.59.07 4.74.07s3.5-.01 4.74-.07c1.14-.05 1.76-.24 2.18-.4.55-.22.94-.47 1.35-.88.41-.41.66-.8.88-1.35.16-.42.35-1.04.4-2.18.06-1.24.07-1.59.07-4.74s-.01-3.5-.07-4.74c-.05-1.14-.24-1.76-.4-2.18a3.64 3.64 0 0 0-.88-1.35 3.64 3.64 0 0 0-1.35-.88c-.42-.16-1.04-.35-2.18-.4-1.24-.06-1.59-.07-4.74-.07Zm0 3.6a6.12 6.12 0 1 1 0 12.24 6.12 6.12 0 0 1 0-12.24Zm0 2.12a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm6.36-3.77a1.43 1.43 0 1 1 0 2.86 1.43 1.43 0 0 1 0-2.86Z" />
    </svg>
  ),
  x: (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M17.53 3h3.04l-6.64 7.59L21.75 21h-6.11l-4.79-6.26L5.28 21H2.24l7.1-8.12L2.25 3h6.27l4.33 5.72L17.53 3Zm-1.07 16.17h1.69L7.6 4.73H5.79l10.67 14.44Z" />
    </svg>
  ),
  facebook: (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.52 1.49-3.91 3.77-3.91 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.45 2.91h-2.33V22c4.78-.76 8.44-4.92 8.44-9.94Z" />
    </svg>
  ),
};

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
