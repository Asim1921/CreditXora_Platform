"use client";

import { useState } from "react";
import { CheckCircle2, Send } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Field, Select, TextArea, TextInput } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { ApiError, api } from "@/lib/api";
import { CONTACT_REASONS } from "@/lib/content";
import { formatPhoneInput } from "@/lib/format";

type FormState = {
  name: string;
  email: string;
  phone: string;
  reason: string;
  message: string;
};

const EMPTY: FormState = {
  name: "",
  email: "",
  phone: "",
  reason: CONTACT_REASONS[0],
  message: "",
};

export function ContactForm() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const toast = useToast();

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const validate = () => {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) next.name = "Enter your name.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) {
      next.email = "Enter a valid email address.";
    }
    if (form.message.trim().length < 10) {
      next.message = "Tell us a little more so we can help (at least 10 characters).";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      await api.post<{ message: string }>("/contact", {
        name: form.name,
        email: form.email,
        phone: form.phone || null,
        reason: form.reason,
        message: form.message,
      });
      setSent(true);
      setForm(EMPTY);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "We couldn't send that just now. Please try again or email us directly.";
      toast.error("Message not sent", message);
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div className="card-surface flex flex-col items-center gap-4 p-10 text-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          <CheckCircle2 className="size-7" aria-hidden />
        </span>
        <h2 className="font-display text-xl font-bold text-navy-900">
          Thank you for reaching out
        </h2>
        <p className="max-w-sm text-[0.9375rem] leading-relaxed text-muted">
          A Creditxora representative will respond during business hours, Monday to Friday,
          9:00 AM – 6:00 PM ET.
        </p>
        <Button variant="outline" onClick={() => setSent(false)}>
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="card-surface p-6 sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Name" required error={errors.name} htmlFor="contact-name">
          <TextInput
            id="contact-name"
            name="name"
            autoComplete="name"
            value={form.name}
            error={Boolean(errors.name)}
            onChange={(event) => set("name", event.target.value)}
            placeholder="Jordan Hale"
          />
        </Field>

        <Field label="Email" required error={errors.email} htmlFor="contact-email">
          <TextInput
            id="contact-email"
            name="email"
            type="email"
            autoComplete="email"
            value={form.email}
            error={Boolean(errors.email)}
            onChange={(event) => set("email", event.target.value)}
            placeholder="you@example.com"
          />
        </Field>

        <Field label="Phone" hint="Optional" htmlFor="contact-phone">
          <TextInput
            id="contact-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            value={form.phone}
            onChange={(event) => set("phone", formatPhoneInput(event.target.value))}
            placeholder="(555) 123-4567"
          />
        </Field>

        <Field label="Reason for contacting" htmlFor="contact-reason">
          <Select
            id="contact-reason"
            name="reason"
            value={form.reason}
            onChange={(event) => set("reason", event.target.value)}
          >
            {CONTACT_REASONS.map((reason) => (
              <option key={reason} value={reason}>
                {reason}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field
        label="Message"
        required
        className="mt-5"
        error={errors.message}
        htmlFor="contact-message"
      >
        <TextArea
          id="contact-message"
          name="message"
          value={form.message}
          error={Boolean(errors.message)}
          onChange={(event) => set("message", event.target.value)}
          placeholder="Tell us what you're dealing with and what you'd like help understanding."
        />
      </Field>

      <p className="mt-5 text-xs leading-relaxed text-muted">
        By submitting this form you consent to being contacted by Creditxora about your
        enquiry. Please don’t include Social Security numbers, account numbers or other
        sensitive identifiers in this message — those are collected securely inside the
        client portal.
      </p>

      <Button type="submit" size="lg" loading={submitting} className="mt-6 w-full sm:w-auto">
        {!submitting ? <Send className="size-4" aria-hidden /> : null}
        Send message
      </Button>
    </form>
  );
}
