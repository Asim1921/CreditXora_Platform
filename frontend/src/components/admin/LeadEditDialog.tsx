"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Field, Select, TextArea, TextInput } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { Alert, LoadingPanel } from "@/components/ui/Primitives";
import { useToast } from "@/components/ui/Toast";
import { ApiError, api } from "@/lib/api";
import { clsx } from "@/lib/clsx";
import {
  BUREAU_OPTIONS,
  CONCERN_OPTIONS,
  GOAL_OPTIONS,
  NEGATIVE_ACCOUNT_OPTIONS,
  SCORE_RANGE_OPTIONS,
  US_STATES,
} from "@/lib/content";
import { formatPhoneInput } from "@/lib/format";
import type { Lead, LeadDetail } from "@/lib/types";

type FormState = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  state: string;
  zip_code: string;
  concerns: string[];
  goals: string[];
  score_range: string;
  bureaus: string[];
  negative_accounts: string;
  has_recent_report: boolean | null;
  notes: string;
};

type Errors = Partial<Record<keyof FormState, string>>;

const fromLead = (lead: LeadDetail): FormState => ({
  first_name: lead.first_name,
  last_name: lead.last_name,
  email: lead.email,
  phone: lead.phone,
  state: lead.state,
  zip_code: lead.zip_code,
  concerns: lead.concerns,
  goals: lead.goals,
  score_range: lead.score_range ?? "unknown",
  bureaus: lead.bureaus,
  negative_accounts: lead.negative_accounts ?? "",
  has_recent_report: lead.has_recent_report,
  notes: lead.notes ?? "",
});

/**
 * Corrects the answers a client gave in the Get Started wizard. Everything here
 * is the client's own data — the pipeline fields (status, owner, follow-up) stay
 * on the lead's detail page, and consent can only ever come from the client.
 */
export function LeadEditDialog({
  leadId,
  onClose,
  onSaved,
}: {
  leadId: string | null;
  onClose: () => void;
  onSaved: (lead: Lead) => void;
}) {
  const toast = useToast();

  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // The table row only carries a summary, so the full assessment is fetched
  // when the dialog opens. The caller keys this component by lead id, so each
  // open starts from a clean slate without resetting state here.
  useEffect(() => {
    if (!leadId) return;
    let active = true;

    api
      .get<LeadDetail>(`/admin/leads/${leadId}`, true)
      .then((detail) => {
        if (!active) return;
        setLead(detail);
        setForm(fromLead(detail));
      })
      .catch((caught) => {
        if (!active) return;
        setLoadError(
          caught instanceof ApiError ? caught.message : "We couldn't load this lead.",
        );
      });

    return () => {
      active = false;
    };
  }, [leadId]);

  const set = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => (current ? { ...current, [key]: value } : current));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }, []);

  const validate = (values: FormState): Errors => {
    const next: Errors = {};
    if (!values.first_name.trim()) next.first_name = "Enter a first name.";
    if (!values.last_name.trim()) next.last_name = "Enter a last name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      next.email = "Enter a valid email address.";
    }
    if (values.phone.replace(/\D/g, "").length !== 10) {
      next.phone = "Enter a 10-digit U.S. phone number.";
    }
    if (!values.state) next.state = "Select a state.";
    if (!/^\d{5}(-\d{4})?$/.test(values.zip_code)) {
      next.zip_code = "Enter a valid 5-digit ZIP code.";
    }
    if (values.concerns.length === 0) next.concerns = "Select at least one item.";
    if (values.goals.length === 0) next.goals = "Select at least one goal.";
    return next;
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form || !leadId) return;

    const found = validate(form);
    if (Object.keys(found).length > 0) {
      setErrors(found);
      return;
    }

    setSaving(true);
    try {
      const updated = await api.patch<Lead>(
        `/admin/leads/${leadId}`,
        {
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          email: form.email.trim(),
          phone: form.phone,
          state: form.state,
          zip_code: form.zip_code,
          concerns: form.concerns,
          goals: form.goals,
          score_range: form.score_range,
          bureaus: form.bureaus,
          negative_accounts: form.negative_accounts || null,
          has_recent_report: form.has_recent_report,
          notes: form.notes.trim() || null,
        },
        true,
      );
      onSaved(updated);
      toast.success("Lead updated", "The corrected details are saved.");
      onClose();
    } catch (caught) {
      if (caught instanceof ApiError) {
        setErrors(caught.fieldErrors as Errors);
        toast.error("We couldn't save that", caught.message);
      } else {
        toast.error("We couldn't save that", "Please check your connection and try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={leadId !== null}
      onClose={saving ? () => undefined : onClose}
      title="Edit lead details"
      description={
        lead
          ? `${lead.reference} · submitted answers`
          : "Correcting the answers submitted on the assessment form"
      }
      size="lg"
      footer={
        form ? (
          <>
            <Button variant="ghost" size="sm" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button size="sm" loading={saving} form="lead-edit-form" type="submit">
              Save changes
            </Button>
          </>
        ) : null
      }
    >
      {loadError ? <Alert tone="error">{loadError}</Alert> : null}
      {!form && !loadError ? <LoadingPanel label="Loading lead…" /> : null}

      {form ? (
        <form id="lead-edit-form" onSubmit={save} className="space-y-6">
          <fieldset disabled={saving} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="First name" required error={errors.first_name} htmlFor="edit-first">
                <TextInput
                  id="edit-first"
                  value={form.first_name}
                  error={Boolean(errors.first_name)}
                  onChange={(event) => set("first_name", event.target.value)}
                />
              </Field>
              <Field label="Last name" required error={errors.last_name} htmlFor="edit-last">
                <TextInput
                  id="edit-last"
                  value={form.last_name}
                  error={Boolean(errors.last_name)}
                  onChange={(event) => set("last_name", event.target.value)}
                />
              </Field>
              <Field label="Email" required error={errors.email} htmlFor="edit-email">
                <TextInput
                  id="edit-email"
                  type="email"
                  value={form.email}
                  error={Boolean(errors.email)}
                  onChange={(event) => set("email", event.target.value)}
                />
              </Field>
              <Field label="Phone" required error={errors.phone} htmlFor="edit-phone">
                <TextInput
                  id="edit-phone"
                  inputMode="tel"
                  value={form.phone}
                  error={Boolean(errors.phone)}
                  onChange={(event) => set("phone", formatPhoneInput(event.target.value))}
                />
              </Field>
              <Field label="State" required error={errors.state} htmlFor="edit-state">
                <Select
                  id="edit-state"
                  value={form.state}
                  error={Boolean(errors.state)}
                  onChange={(event) => set("state", event.target.value)}
                >
                  <option value="">Select a state</option>
                  {US_STATES.map((state) => (
                    <option key={state.code} value={state.code}>
                      {state.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="ZIP code" required error={errors.zip_code} htmlFor="edit-zip">
                <TextInput
                  id="edit-zip"
                  inputMode="numeric"
                  maxLength={10}
                  value={form.zip_code}
                  error={Boolean(errors.zip_code)}
                  onChange={(event) =>
                    set("zip_code", event.target.value.replace(/[^\d-]/g, "").slice(0, 10))
                  }
                />
              </Field>
            </div>

            <ChipGroup
              label="Needs help with"
              required
              error={errors.concerns}
              options={CONCERN_OPTIONS}
              selected={form.concerns}
              onChange={(values) => set("concerns", values)}
            />

            <ChipGroup
              label="Credit goals"
              required
              error={errors.goals}
              options={GOAL_OPTIONS}
              selected={form.goals}
              onChange={(values) => set("goals", values)}
            />

            <ChipGroup
              label="Bureaus involved"
              options={BUREAU_OPTIONS}
              selected={form.bureaus}
              onChange={(values) => set("bureaus", values)}
            />

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Score range" htmlFor="edit-score">
                <Select
                  id="edit-score"
                  value={form.score_range}
                  onChange={(event) => set("score_range", event.target.value)}
                >
                  {SCORE_RANGE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Negative accounts" htmlFor="edit-negative">
                <Select
                  id="edit-negative"
                  value={form.negative_accounts}
                  onChange={(event) => set("negative_accounts", event.target.value)}
                >
                  <option value="">Not specified</option>
                  {NEGATIVE_ACCOUNT_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Has a recent report" htmlFor="edit-report">
                <Select
                  id="edit-report"
                  value={
                    form.has_recent_report === null ? "" : form.has_recent_report ? "yes" : "no"
                  }
                  onChange={(event) =>
                    set(
                      "has_recent_report",
                      event.target.value === "" ? null : event.target.value === "yes",
                    )
                  }
                >
                  <option value="">Not specified</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </Select>
              </Field>
            </div>

            <Field label="What they told us" htmlFor="edit-notes">
              <TextArea
                id="edit-notes"
                value={form.notes}
                maxLength={2000}
                className="min-h-24"
                onChange={(event) => set("notes", event.target.value)}
              />
            </Field>

            <p className="text-xs leading-relaxed text-muted">
              Consent to contact isn&apos;t editable here — only the client can give it.
              Every correction is written to the lead&apos;s activity history.
            </p>
          </fieldset>
        </form>
      ) : null}
    </Modal>
  );
}

/** Compact multi-select. Values keep the canonical option order. */
function ChipGroup({
  label,
  required,
  error,
  options,
  selected,
  onChange,
}: {
  label: string;
  required?: boolean;
  error?: string;
  options: readonly { value: string; label: string }[];
  selected: string[];
  onChange: (values: string[]) => void;
}) {
  const toggle = (value: string) => {
    const next = new Set(selected);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    onChange(options.filter((option) => next.has(option.value)).map((option) => option.value));
  };

  return (
    <div>
      <p className="text-sm font-semibold text-navy-800">
        {label}
        {required ? <span className="ml-0.5 text-brand-600">*</span> : null}
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {options.map((option) => {
          const active = selected.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              onClick={() => toggle(option.value)}
              className={clsx(
                "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                active
                  ? "border-brand-500 bg-brand-50 text-brand-700"
                  : "border-navy-200 bg-white text-navy-600 hover:border-navy-300 hover:bg-navy-50",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      {error ? <p className="mt-1.5 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
