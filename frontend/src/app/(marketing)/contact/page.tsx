import type { Metadata } from "next";
import { Clock, Mail, MessageCircle, Phone, Send, ShieldCheck } from "lucide-react";

import { ContactForm } from "@/components/marketing/ContactForm";
import { PageHero } from "@/components/marketing/PageHero";
import { Alert } from "@/components/ui/Primitives";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Reach Creditxora by email, phone, WhatsApp or Telegram, or send a message " +
    "through the contact form.",
};

const CHANNELS = [
  {
    icon: Mail,
    label: "Email",
    value: "support@creditxora.com",
    href: "mailto:support@creditxora.com",
  },
  {
    icon: Phone,
    label: "Phone",
    value: "(888) 555-0137",
    href: "tel:+18885550137",
  },
  {
    icon: MessageCircle,
    label: "WhatsApp",
    value: "Message us on WhatsApp",
    href: "https://wa.me/18885550137",
  },
  {
    icon: Send,
    label: "Telegram",
    value: "@creditxora",
    href: "https://t.me/creditxora",
  },
];

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Talk to a Creditxora specialist"
        description="Questions about your reports, our process, or whether we're the right fit? Reach out. Existing clients can also message their specialist directly inside the portal."
        breadcrumbs={[{ href: "/contact", label: "Contact" }]}
      />

      <section className="container-page py-16 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
          <div className="space-y-6">
            <div>
              <h2 className="font-display text-2xl font-bold text-navy-900">Creditxora</h2>
              <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">
                U.S.-focused credit report review, dispute support and credit-building
                guidance.
              </p>
            </div>

            <ul className="space-y-3">
              {CHANNELS.map((channel) => (
                <li key={channel.label}>
                  <a
                    href={channel.href}
                    target={channel.href.startsWith("http") ? "_blank" : undefined}
                    rel={channel.href.startsWith("http") ? "noopener noreferrer" : undefined}
                    className="flex items-center gap-4 rounded-2xl border border-navy-100 bg-white p-4 transition hover:border-brand-200 hover:shadow-soft"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                      <channel.icon className="size-5" aria-hidden />
                    </span>
                    <span>
                      <span className="block text-xs font-bold uppercase tracking-wide text-muted">
                        {channel.label}
                      </span>
                      <span className="block text-[0.9375rem] font-semibold text-navy-900">
                        {channel.value}
                      </span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>

            <div className="rounded-2xl border border-navy-100 bg-sand-50 p-5">
              <p className="flex items-center gap-2 text-sm font-bold text-navy-900">
                <Clock className="size-4 text-brand-600" aria-hidden />
                Business hours
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Monday – Friday, 9:00 AM – 6:00 PM ET
                <br />
                Messages received outside these hours are answered the next business day.
              </p>
            </div>

            <Alert tone="info" title="Existing client?">
              Sign in to your portal and message your specialist there — it keeps the whole
              conversation attached to your file, alongside your documents and disputes.
            </Alert>
          </div>

          <div>
            <ContactForm />
            <p className="mt-5 flex items-start gap-2 text-xs leading-relaxed text-muted">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden />
              Your information is kept confidential and is never sold. Sensitive documents
              are collected only through the encrypted client portal, never by email.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
