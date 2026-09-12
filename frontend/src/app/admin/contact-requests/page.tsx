"use client";

import { useEffect, useState } from "react";
import { Mail, Mails, Phone } from "lucide-react";

import { Alert, Badge, EmptyState, LoadingPanel } from "@/components/ui/Primitives";
import { api } from "@/lib/api";
import { formatDateTime, formatRelative } from "@/lib/format";

type ContactRequest = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  reason: string;
  message: string;
  handled: boolean;
  created_at: string;
};

export default function AdminContactRequestsPage() {
  const [items, setItems] = useState<ContactRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<ContactRequest[]>("/admin/contact-requests", true)
      .then(setItems)
      .catch(() => setError("We couldn't load contact requests. Please refresh."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingPanel label="Loading contact requests…" />;
  if (error) return <Alert tone="error">{error}</Alert>;

  return (
    <div className="mx-auto max-w-3xl">
      <section className="card-surface p-6">
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold text-navy-900">
              Contact requests
            </h2>
            <p className="text-sm text-muted">
              Submissions from the website contact form
            </p>
          </div>
          <p className="text-sm text-muted">{items.length} total</p>
        </div>

        {items.length === 0 ? (
          <EmptyState
            className="mt-5"
            icon={<Mails className="size-5" />}
            title="No contact requests yet"
            description="Messages sent through the website contact form land here."
          />
        ) : (
          <ul className="mt-5 space-y-3">
            {items.map((item) => (
              <li key={item.id} className="rounded-xl border border-navy-100 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-display text-base font-bold text-navy-900">
                      {item.name}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                      <a
                        href={`mailto:${item.email}`}
                        className="inline-flex items-center gap-1.5 transition hover:text-navy-800"
                      >
                        <Mail className="size-3.5" aria-hidden />
                        {item.email}
                      </a>
                      {item.phone ? (
                        <a
                          href={`tel:${item.phone.replace(/\D/g, "")}`}
                          className="inline-flex items-center gap-1.5 transition hover:text-navy-800"
                        >
                          <Phone className="size-3.5" aria-hidden />
                          {item.phone}
                        </a>
                      ) : null}
                    </div>
                  </div>
                  <Badge tone="neutral">{item.reason}</Badge>
                </div>

                <p className="mt-3 whitespace-pre-line rounded-xl bg-navy-50/60 p-4 text-sm leading-relaxed text-navy-700">
                  {item.message}
                </p>

                <p className="mt-2.5 text-xs text-muted">
                  {formatDateTime(item.created_at)} · {formatRelative(item.created_at)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
