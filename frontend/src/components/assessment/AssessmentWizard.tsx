"use client";

import Link from "next/link";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Copy,
  Lock,
  Send,
  Target,
  UserRound,
} from "lucide-react";

import { Button, ButtonLink } from "@/components/ui/Button";
import { Checkbox, Field, OptionCard, Select, TextArea, TextInput } from "@/components/ui/Field";
import { Alert, Badge } from "@/components/ui/Primitives";
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
import type { AssessmentReceipt } from "@/lib/types";

const STEPS = [
  { id: 1, label: "Your details", icon: UserRound },
  { id: 2, label: "What you need", icon: ClipboardList },
  { id: 3, label: "Your goals", icon: Target },
  { id: 4, label: "Your situation", icon: ClipboardList },
  { id: 5, label: "Review & submit", icon: Send },
] as const;

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
  consent_contact: boolean;
};

const INITIAL: FormState = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  state: "",
  zip_code: "",
  concerns: [],
  goals: [],
  score_range: "unknown",
  bureaus: [],
  negative_accounts: "",
  has_recent_report: null,
  notes: "",
  consent_contact: false,
};

type Errors = Partial<Record<keyof FormState, string>>;

export function AssessmentWizard() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<AssessmentReceipt | null>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  const set = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }, []);

  const toggle = useCallback((key: "concerns" | "goals" | "bureaus", value: string) => {
    setForm((current) => {
      const list = current[key];
      return {
        ...current,
        [key]: list.includes(value)
          ? list.filter((item) => item !== value)
          : [...list, value],
      };
    });
    setErrors((current) => ({ ...current, [key]: undefined }));
  }, []);

  const validateStep = useCallback(
    (target: number): boolean => {
      const next: Errors = {};

      if (target === 1) {
        if (!form.first_name.trim()) next.first_name = "Enter your first name.";
        if (!form.last_name.trim()) next.last_name = "Enter your last name.";
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) {
          next.email = "Enter a valid email address.";
        }
        if (form.phone.replace(/\D/g, "").length !== 10) {
          next.phone = "Enter a 10-digit U.S. phone number.";
        }
        if (!form.state) next.state = "Select your state.";
        if (!/^\d{5}(-\d{4})?$/.test(form.zip_code)) {
          next.zip_code = "Enter a valid 5-digit ZIP code.";
        }
      }

      if (target === 2 && form.concerns.length === 0) {
        next.concerns = "Select at least one item, or choose “Not sure / full review”.";
      }

      if (target === 3 && form.goals.length === 0) {
        next.goals = "Select at least one goal.";
      }

      if (target === 5 && !form.consent_contact) {
        next.consent_contact = "We need your consent before a specialist can contact you.";
      }

      setErrors(next);
      return Object.keys(next).length === 0;
    },
    [form],
  );

  const scrollToTop = () => {
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const goNext = () => {
    if (!validateStep(step)) return;
    setStep((current) => Math.min(current + 1, STEPS.length));
    scrollToTop();
  };

  const goBack = () => {
    setStep((current) => Math.max(current - 1, 1));
    scrollToTop();
  };

  /** Jumping backwards from the review step is always safe; forward is gated. */
  const jumpTo = (target: number) => {
    if (target < step) {
      setStep(target);
      scrollToTop();
    }
  };

  const submit = async () => {
    // Re-run every gate so a user who edited and jumped can't skip a rule.
    for (const target of [1, 2, 3, 5]) {
      if (!validateStep(target)) {
        setStep(target);
        scrollToTop();
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        negative_accounts: form.negative_accounts || null,
        notes: form.notes.trim() || null,
        source: "website",
      };
      const result = await api.post<AssessmentReceipt>("/assessments", payload);
      setReceipt(result);
      scrollToTop();
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.fieldErrors as Errors);
        toast.error("We couldn't submit that", error.message);
        // Send the user back to the step holding the rejected field.
        const field = Object.keys(error.fieldErrors)[0];
        if (field && ["first_name", "last_name", "email", "phone", "state", "zip_code"].includes(field)) {
          setStep(1);
          scrollToTop();
        }
      } else {
        toast.error(
          "We couldn't submit that",
          "Please check your connection and try again.",
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const progress = useMemo(() => ((step - 1) / (STEPS.length - 1)) * 100, [step]);

  if (receipt) return <SuccessPanel receipt={receipt} />;

  return (
    <div ref={topRef} className="scroll-mt-24">
      <ProgressHeader step={step} progress={progress} onJump={jumpTo} />

      <div className="card-surface mt-6 p-6 sm:p-9">
        {step === 1 ? (
          <StepPersonal form={form} errors={errors} set={set} />
        ) : step === 2 ? (
          <StepConcerns form={form} errors={errors} toggle={toggle} />
        ) : step === 3 ? (
          <StepGoals form={form} errors={errors} toggle={toggle} />
        ) : step === 4 ? (
          <StepSituation form={form} set={set} toggle={toggle} />
        ) : (
          <StepReview form={form} errors={errors} set={set} onEdit={jumpTo} />
        )}

        <div className="mt-9 flex flex-col-reverse gap-3 border-t border-navy-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
          {step > 1 ? (
            <Button variant="ghost" onClick={goBack} type="button">
              <ArrowLeft className="size-4" aria-hidden />
              Back
            </Button>
          ) : (
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-2 text-sm font-medium text-muted transition hover:text-navy-800"
            >
              <ArrowLeft className="size-4" aria-hidden />
              Back to site
            </Link>
          )}

          {step < STEPS.length ? (
            <Button onClick={goNext} size="lg" type="button" className="group">
              Continue
              <ArrowRight
                className="size-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </Button>
          ) : (
            <Button onClick={submit} size="lg" loading={submitting} type="button">
              Request My Credit Assessment
            </Button>
          )}
        </div>
      </div>

      <p className="mt-6 flex items-start justify-center gap-2 text-center text-xs leading-relaxed text-muted">
        <Lock className="mt-0.5 size-3.5 shrink-0 text-brand-600" aria-hidden />
        Your information is kept confidential and is never sold. This form does not ask for
        your Social Security number — sensitive identifiers are collected only inside the
        encrypted client portal.
      </p>
    </div>
  );
}

// --- Progress --------------------------------------------------------------

function ProgressHeader({
  step,
  progress,
  onJump,
}: {
  step: number;
  progress: number;
  onJump: (target: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-semibold text-navy-800">
          Step {step} of {STEPS.length}
          <span className="ml-2 font-normal text-muted">{STEPS[step - 1].label}</span>
        </p>
        <p className="text-xs font-medium text-muted">About 3 minutes</p>
      </div>

      <div
        className="mt-3 h-1.5 overflow-hidden rounded-full bg-navy-100"
        role="progressbar"
        aria-valuenow={step}
        aria-valuemin={1}
        aria-valuemax={STEPS.length}
        aria-label="Assessment progress"
      >
        <div
          className="h-full rounded-full bg-brand-600 transition-all duration-500 ease-out"
          style={{ width: `${Math.max(progress, 6)}%` }}
        />
      </div>

      <ol className="mt-5 hidden grid-cols-5 gap-2 sm:grid">
        {STEPS.map((item) => {
          const state =
            item.id < step ? "complete" : item.id === step ? "current" : "upcoming";
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onJump(item.id)}
                disabled={state === "upcoming"}
                className={clsx(
                  "flex w-full flex-col items-start gap-1.5 rounded-xl border-2 p-3 text-left transition",
                  state === "complete" &&
                    "border-brand-200 bg-brand-50/60 hover:border-brand-400",
                  state === "current" && "border-brand-600 bg-white",
                  state === "upcoming" && "cursor-default border-navy-100 bg-navy-50/40",
                )}
              >
                <span
                  className={clsx(
                    "flex size-6 items-center justify-center rounded-lg text-xs font-bold",
                    state === "complete" && "bg-brand-600 text-white",
                    state === "current" && "bg-brand-600 text-white",
                    state === "upcoming" && "bg-navy-100 text-navy-400",
                  )}
                >
                  {state === "complete" ? (
                    <CheckCircle2 className="size-3.5" aria-hidden />
                  ) : (
                    item.id
                  )}
                </span>
                <span
                  className={clsx(
                    "text-xs font-semibold leading-tight",
                    state === "upcoming" ? "text-navy-400" : "text-navy-800",
                  )}
                >
                  {item.label}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// --- Steps -----------------------------------------------------------------

function StepHeading({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-7">
      <h2 className="font-display text-2xl font-bold text-navy-900 sm:text-[1.75rem]">
        {title}
      </h2>
      <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">{description}</p>
    </div>
  );
}

type SetFn = <K extends keyof FormState>(key: K, value: FormState[K]) => void;

function StepPersonal({
  form,
  errors,
  set,
}: {
  form: FormState;
  errors: Errors;
  set: SetFn;
}) {
  return (
    <div className="animate-fade-in">
      <StepHeading
        title="Let's start with your details"
        description="We use these to match your credit reports and to reach you about your assessment. Nothing here is shared with a third party."
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="First name" required error={errors.first_name} htmlFor="first_name">
          <TextInput
            id="first_name"
            autoComplete="given-name"
            value={form.first_name}
            error={Boolean(errors.first_name)}
            onChange={(event) => set("first_name", event.target.value)}
            placeholder="Jordan"
          />
        </Field>

        <Field label="Last name" required error={errors.last_name} htmlFor="last_name">
          <TextInput
            id="last_name"
            autoComplete="family-name"
            value={form.last_name}
            error={Boolean(errors.last_name)}
            onChange={(event) => set("last_name", event.target.value)}
            placeholder="Hale"
          />
        </Field>

        <Field label="Email" required error={errors.email} htmlFor="email">
          <TextInput
            id="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            value={form.email}
            error={Boolean(errors.email)}
            onChange={(event) => set("email", event.target.value)}
            placeholder="you@example.com"
          />
        </Field>

        <Field label="Phone" required error={errors.phone} htmlFor="phone">
          <TextInput
            id="phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            value={form.phone}
            error={Boolean(errors.phone)}
            onChange={(event) => set("phone", formatPhoneInput(event.target.value))}
            placeholder="(555) 123-4567"
          />
        </Field>

        <Field label="State" required error={errors.state} htmlFor="state">
          <Select
            id="state"
            autoComplete="address-level1"
            value={form.state}
            error={Boolean(errors.state)}
            onChange={(event) => set("state", event.target.value)}
          >
            <option value="">Select your state</option>
            {US_STATES.map((state) => (
              <option key={state.code} value={state.code}>
                {state.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="ZIP code" required error={errors.zip_code} htmlFor="zip_code">
          <TextInput
            id="zip_code"
            autoComplete="postal-code"
            inputMode="numeric"
            maxLength={10}
            value={form.zip_code}
            error={Boolean(errors.zip_code)}
            onChange={(event) =>
              set("zip_code", event.target.value.replace(/[^\d-]/g, "").slice(0, 10))
            }
            placeholder="28202"
          />
        </Field>
      </div>
    </div>
  );
}

function StepConcerns({
  form,
  errors,
  toggle,
}: {
  form: FormState;
  errors: Errors;
  toggle: (key: "concerns" | "goals" | "bureaus", value: string) => void;
}) {
  return (
    <div className="animate-fade-in">
      <StepHeading
        title="What do you need help with?"
        description="Select everything that applies. If you’re not sure what’s on your reports, choose “Not sure / full review” and a specialist will read all three."
      />

      {errors.concerns ? (
        <Alert tone="error" className="mb-5">
          {errors.concerns}
        </Alert>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        {CONCERN_OPTIONS.map((option) => (
          <OptionCard
            key={option.value}
            checked={form.concerns.includes(option.value)}
            onToggle={() => toggle("concerns", option.value)}
            title={option.label}
            description={option.description}
          />
        ))}
      </div>
    </div>
  );
}

function StepGoals({
  form,
  errors,
  toggle,
}: {
  form: FormState;
  errors: Errors;
  toggle: (key: "concerns" | "goals" | "bureaus", value: string) => void;
}) {
  return (
    <div className="animate-fade-in">
      <StepHeading
        title="What are you working toward?"
        description="Your goal changes the order we address things in. Preparing for a mortgage looks different from rebuilding after a repossession."
      />

      {errors.goals ? (
        <Alert tone="error" className="mb-5">
          {errors.goals}
        </Alert>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        {GOAL_OPTIONS.map((option) => (
          <OptionCard
            key={option.value}
            checked={form.goals.includes(option.value)}
            onToggle={() => toggle("goals", option.value)}
            title={option.label}
            description={option.description}
          />
        ))}
      </div>
    </div>
  );
}

function StepSituation({
  form,
  set,
  toggle,
}: {
  form: FormState;
  set: SetFn;
  toggle: (key: "concerns" | "goals" | "bureaus", value: string) => void;
}) {
  return (
    <div className="animate-fade-in">
      <StepHeading
        title="Where does your credit stand today?"
        description="Estimates are fine — none of this needs to be exact. It helps your specialist prepare before your first conversation."
      />

      <div className="space-y-8">
        <fieldset>
          <legend className="text-sm font-semibold text-navy-800">
            Approximate credit score range
          </legend>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {SCORE_RANGE_OPTIONS.map((option) => (
              <OptionCard
                key={option.value}
                type="radio"
                name="score_range"
                checked={form.score_range === option.value}
                onToggle={() => set("score_range", option.value)}
                title={option.label}
              />
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-sm font-semibold text-navy-800">
            Which bureaus are involved?
          </legend>
          <p className="mt-1 text-sm text-muted">
            Select any you know about — leave blank if you’re not sure.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {BUREAU_OPTIONS.map((option) => (
              <OptionCard
                key={option.value}
                checked={form.bureaus.includes(option.value)}
                onToggle={() => toggle("bureaus", option.value)}
                title={option.label}
              />
            ))}
          </div>
        </fieldset>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Number of negative accounts" htmlFor="negative_accounts">
            <Select
              id="negative_accounts"
              value={form.negative_accounts}
              onChange={(event) => set("negative_accounts", event.target.value)}
            >
              <option value="">Select an estimate</option>
              {NEGATIVE_ACCOUNT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </Field>

          <fieldset>
            <legend className="text-sm font-semibold text-navy-800">
              Do you have a recent credit report?
            </legend>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {[
                { label: "Yes", value: true },
                { label: "No", value: false },
              ].map((option) => (
                <OptionCard
                  key={option.label}
                  type="radio"
                  name="has_recent_report"
                  checked={form.has_recent_report === option.value}
                  onToggle={() => set("has_recent_report", option.value)}
                  title={option.label}
                />
              ))}
            </div>
          </fieldset>
        </div>

        <Field
          label="Anything else we should know?"
          hint="Optional. Context about your situation helps your specialist prepare."
          htmlFor="notes"
        >
          <TextArea
            id="notes"
            value={form.notes}
            maxLength={2000}
            onChange={(event) => set("notes", event.target.value)}
            placeholder="For example: I'm trying to be mortgage-ready by next summer, and there are two collections I don't recognise."
          />
        </Field>
      </div>
    </div>
  );
}

function StepReview({
  form,
  errors,
  set,
  onEdit,
}: {
  form: FormState;
  errors: Errors;
  set: SetFn;
  onEdit: (step: number) => void;
}) {
  const labelsFor = (
    values: string[],
    options: readonly { value: string; label: string }[],
  ) => values.map((value) => options.find((o) => o.value === value)?.label ?? value);

  const rows = [
    {
      step: 1,
      label: "Your details",
      content: (
        <>
          <p className="font-semibold text-navy-900">
            {form.first_name} {form.last_name}
          </p>
          <p>{form.email}</p>
          <p>{form.phone}</p>
          <p>
            {US_STATES.find((s) => s.code === form.state)?.name ?? form.state} {form.zip_code}
          </p>
        </>
      ),
    },
    {
      step: 2,
      label: "What you need help with",
      content: (
        <div className="flex flex-wrap gap-1.5">
          {labelsFor(form.concerns, CONCERN_OPTIONS).map((label) => (
            <Badge key={label} tone="brand">
              {label}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      step: 3,
      label: "Your goals",
      content: (
        <div className="flex flex-wrap gap-1.5">
          {labelsFor(form.goals, GOAL_OPTIONS).map((label) => (
            <Badge key={label} tone="blue">
              {label}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      step: 4,
      label: "Your situation",
      content: (
        <>
          <p>
            Score range:{" "}
            <span className="font-medium text-navy-900">
              {SCORE_RANGE_OPTIONS.find((o) => o.value === form.score_range)?.label ?? "—"}
            </span>
          </p>
          <p>
            Bureaus:{" "}
            <span className="font-medium text-navy-900">
              {form.bureaus.length
                ? labelsFor(form.bureaus, BUREAU_OPTIONS).join(", ")
                : "Not specified"}
            </span>
          </p>
          <p>
            Negative accounts:{" "}
            <span className="font-medium text-navy-900">
              {form.negative_accounts || "Not specified"}
            </span>
          </p>
          <p>
            Recent report:{" "}
            <span className="font-medium text-navy-900">
              {form.has_recent_report === null
                ? "Not specified"
                : form.has_recent_report
                  ? "Yes"
                  : "No"}
            </span>
          </p>
          {form.notes ? (
            <p className="mt-2 rounded-lg bg-navy-50 p-3 text-sm italic">“{form.notes}”</p>
          ) : null}
        </>
      ),
    },
  ];

  return (
    <div className="animate-fade-in">
      <StepHeading
        title="Review and submit"
        description="Check everything looks right. You can go back and change any section before submitting."
      />

      <div className="space-y-3">
        {rows.map((row) => (
          <div
            key={row.step}
            className="rounded-2xl border border-navy-100 bg-navy-50/40 p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-xs font-bold uppercase tracking-wide text-muted">
                {row.label}
              </h3>
              <button
                type="button"
                onClick={() => onEdit(row.step)}
                className="text-xs font-semibold text-brand-700 underline underline-offset-2 transition hover:text-brand-800"
              >
                Edit
              </button>
            </div>
            <div className="mt-2.5 space-y-1 text-sm text-muted">{row.content}</div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <Checkbox
          checked={form.consent_contact}
          onChange={(value) => set("consent_contact", value)}
          error={Boolean(errors.consent_contact)}
        >
          I consent to being contacted by Creditxora about this assessment by phone, email
          or text. I understand that Creditxora provides credit report review and
          dispute-support services, does not guarantee specific credit-score increases,
          deletions or approvals, and that I may dispute inaccurate information with the
          credit bureaus myself at no cost.
        </Checkbox>
        {errors.consent_contact ? (
          <p className="mt-2 text-sm text-red-600">{errors.consent_contact}</p>
        ) : null}
      </div>
    </div>
  );
}

// --- Success ---------------------------------------------------------------

function SuccessPanel({ receipt }: { receipt: AssessmentReceipt }) {
  const [copied, setCopied] = useState(false);

  const copyReference = async () => {
    try {
      await navigator.clipboard.writeText(receipt.reference);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — the reference is still on screen */
    }
  };

  return (
    <div className="card-surface animate-fade-up p-8 text-center sm:p-12">
      <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
        <CheckCircle2 className="size-8" aria-hidden />
      </span>

      <h1 className="mt-6 font-display text-3xl font-bold text-navy-900">
        Thank you — we’ve received your request
      </h1>
      <p className="mx-auto mt-4 max-w-xl text-[1.0625rem] leading-relaxed text-muted">
        {receipt.message}
      </p>

      <div className="mx-auto mt-8 max-w-xs rounded-2xl border border-navy-100 bg-navy-50/60 p-5">
        <p className="text-xs font-bold uppercase tracking-wide text-muted">
          Your reference number
        </p>
        <p className="mt-1.5 font-display text-2xl font-extrabold tracking-wide text-navy-900">
          {receipt.reference}
        </p>
        <button
          type="button"
          onClick={copyReference}
          className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 transition hover:text-brand-800"
        >
          <Copy className="size-3" aria-hidden />
          {copied ? "Copied" : "Copy reference"}
        </button>
      </div>

      <div className="mx-auto mt-8 max-w-lg text-left">
        <h2 className="font-display text-sm font-bold uppercase tracking-wide text-navy-900">
          What happens next
        </h2>
        <ol className="mt-3 space-y-2.5">
          {[
            "A Creditxora specialist reviews your assessment, usually within one business day.",
            "We contact you to confirm your goal and explain the appropriate next steps.",
            "If you move forward, your secure client portal is opened so you can upload your reports.",
          ].map((item, index) => (
            <li key={item} className="flex gap-3">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-brand-600 text-[0.625rem] font-bold text-white">
                {index + 1}
              </span>
              <span className="text-sm leading-relaxed text-muted">{item}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
        <ButtonLink href="/resources" variant="outline">
          Read our credit guides
        </ButtonLink>
        <ButtonLink href="/">Back to home</ButtonLink>
      </div>

      <p className="mx-auto mt-8 max-w-lg text-xs leading-relaxed text-muted">
        A confirmation has been sent to your email address. Results vary by individual
        circumstances, and Creditxora does not guarantee specific credit-score increases,
        deletions, approvals, or outcomes.
      </p>
    </div>
  );
}
