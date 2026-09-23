"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CheckCircle2,
  Eye,
  EyeOff,
  MailCheck,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { Logo } from "@/components/brand/Logo";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Checkbox, Field, OptionCard, Select, TextInput } from "@/components/ui/Field";
import { Alert, ResultsDisclaimer, Spinner } from "@/components/ui/Primitives";
import { ApiError } from "@/lib/api";
import { homeForRole, useAuth } from "@/lib/auth";
import { US_STATES } from "@/lib/content";
import { formatPhoneInput } from "@/lib/format";
import type { SignupPayload, SignupRole } from "@/lib/types";

const FIELD_KEYS = [
  "first_name",
  "last_name",
  "email",
  "password",
  "password_confirm",
  "phone",
  "state",
  "zip_code",
  "accept_terms",
] as const;

type FieldKey = (typeof FIELD_KEYS)[number];
type FieldErrors = Partial<Record<FieldKey, string>>;

type FormState = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  password_confirm: string;
  phone: string;
  state: string;
  zip_code: string;
  accept_terms: boolean;
};

const EMPTY_FORM: FormState = {
  first_name: "",
  last_name: "",
  email: "",
  password: "",
  password_confirm: "",
  phone: "",
  state: "",
  zip_code: "",
  accept_terms: false,
};

const isFieldKey = (value: string): value is FieldKey =>
  (FIELD_KEYS as readonly string[]).includes(value);

/** Mirrors the backend's SignupRequest rules so the form answers before a round-trip. */
function validate(form: FormState, role: SignupRole): FieldErrors {
  const errors: FieldErrors = {};

  if (!form.first_name.trim()) errors.first_name = "Enter your first name.";
  if (!form.last_name.trim()) errors.last_name = "Enter your last name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = "Enter a valid email address.";
  }

  if (form.password.length < 10) {
    errors.password = "Use at least 10 characters.";
  } else if (/^[A-Za-z]+$/.test(form.password) || /^\d+$/.test(form.password)) {
    errors.password = "Use a mix of letters, numbers or symbols.";
  } else if (new TextEncoder().encode(form.password).length > 72) {
    // bcrypt truncates past 72 bytes, so the backend rejects rather than
    // silently ignoring the tail.
    errors.password = "Password must be 72 bytes or fewer.";
  }
  if (form.password_confirm !== form.password) {
    errors.password_confirm = "Both passwords must match.";
  }

  // A client file feeds the CRM, so contact details aren't optional there.
  if (role === "client") {
    const digits = form.phone.replace(/\D/g, "");
    const national = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
    if (!form.phone.trim()) errors.phone = "A contact phone number is required.";
    else if (national.length !== 10) errors.phone = "Enter a valid 10-digit U.S. phone number.";

    if (!form.state) errors.state = "Select the state you live in.";
    if (form.zip_code && !/^\d{5}(-\d{4})?$/.test(form.zip_code)) {
      errors.zip_code = "Enter a valid 5-digit ZIP code.";
    }
  }

  if (!form.accept_terms) {
    errors.accept_terms = "You must accept the terms and privacy policy to create an account.";
  }
  return errors;
}

/** Splits an ApiError into per-field messages plus anything left over. */
function readApiError(caught: ApiError): { fields: FieldErrors; message: string | null } {
  if (caught.status === 409) return { fields: { email: caught.message }, message: null };

  const fields: FieldErrors = {};
  for (const [key, message] of Object.entries(caught.fieldErrors)) {
    if (isFieldKey(key)) fields[key] = message;
  }
  if (Object.keys(fields).length > 0) return { fields, message: null };

  // A model-level validator reports no field of its own, so the backend folds
  // the name into the detail as "phone: …" — pull it back out.
  const [, key, rest] = /^(\w+):\s*(.+)$/.exec(caught.message) ?? [];
  if (key && rest && isFieldKey(key)) {
    const single: FieldErrors = {};
    single[key] = rest;
    return { fields: single, message: null };
  }

  return { fields, message: caught.message };
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center">
          <Spinner className="size-7" />
        </div>
      }
    >
      <SignupView />
    </Suspense>
  );
}

function SignupView() {
  const { signUp, user, loading } = useAuth();
  const router = useRouter();
  const params = useSearchParams();

  const [role, setRole] = useState<SignupRole>(
    params.get("role") === "specialist" ? "specialist" : "client",
  );
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);

  const isClient = role === "client";

  // Already signed in? Don't show them a registration form.
  useEffect(() => {
    if (!loading && user && !pendingMessage) router.replace(homeForRole(user.role));
  }, [loading, user, pendingMessage, router]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!(key in current)) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  // Switching to a specialist hides the contact fields, so their errors would
  // otherwise linger out of sight.
  const chooseRole = (next: SignupRole) => {
    setRole(next);
    setErrors((current) => {
      const cleaned = { ...current };
      delete cleaned.phone;
      delete cleaned.state;
      delete cleaned.zip_code;
      return cleaned;
    });
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);

    const found = validate(form, role);
    if (Object.keys(found).length > 0) {
      setErrors(found);
      return;
    }
    setErrors({});
    setSubmitting(true);

    const payload: SignupPayload = {
      role,
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      email: form.email.trim(),
      password: form.password,
      accept_terms: form.accept_terms,
    };
    // Contact details belong to a client file — a specialist has none, and
    // sending half-filled ones would only fail validation.
    if (isClient) {
      payload.phone = form.phone.trim();
      payload.state = form.state;
      payload.zip_code = form.zip_code.trim() || null;
    }

    try {
      const result = await signUp(payload);
      if (result.session) {
        router.replace(homeForRole(result.session.user.role));
        return;
      }
      setPendingMessage(result.message);
    } catch (caught) {
      if (caught instanceof ApiError) {
        const { fields, message } = readApiError(caught);
        setErrors(fields);
        setFormError(message);
      } else {
        setFormError(
          "We couldn't create your account. Please check your connection and try again.",
        );
      }
      setSubmitting(false);
    }
  };

  if (pendingMessage) {
    return <PendingApproval message={pendingMessage} />;
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Form side */}
      <div className="flex flex-col px-5 py-8 sm:px-10 lg:px-16">
        <div className="flex items-center justify-between">
          <Link href="/" aria-label="Creditxora home">
            <Logo markClassName="h-8 w-8" />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition hover:text-navy-900"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Back to site
          </Link>
        </div>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-12">
          <h1 className="font-display text-3xl font-extrabold text-navy-900">
            Create your Creditxora account
          </h1>
          <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">
            Already registered?{" "}
            <Link
              href="/login"
              className="font-semibold text-brand-700 underline underline-offset-2"
            >
              Sign in instead
            </Link>
            .
          </p>

          {formError ? (
            <Alert tone="error" className="mt-6">
              {formError}
            </Alert>
          ) : null}

          <form onSubmit={submit} className="mt-7 space-y-5" noValidate>
            <fieldset className="space-y-2.5">
              <legend className="text-sm font-semibold text-navy-800">
                What kind of account do you need?
              </legend>
              <OptionCard
                type="radio"
                name="signup-role"
                checked={isClient}
                onToggle={() => chooseRole("client")}
                icon={<UserRound className="size-4 text-brand-600" aria-hidden />}
                title="Client account"
                description="Upload your credit reports and track your file in the portal."
              />
              <OptionCard
                type="radio"
                name="signup-role"
                checked={!isClient}
                onToggle={() => chooseRole("specialist")}
                icon={<BriefcaseBusiness className="size-4 text-brand-600" aria-hidden />}
                title="Specialist account (Creditxora staff)"
                description="Requires administrator approval before you can sign in."
              />
            </fieldset>

            {!isClient ? (
              <Alert tone="info">
                Specialist accounts reach every client file, so an administrator reviews
                each request. You&apos;ll be emailed once your account is approved.
              </Alert>
            ) : null}

            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label="First name"
                htmlFor="signup-first-name"
                required
                error={errors.first_name}
              >
                <TextInput
                  id="signup-first-name"
                  autoComplete="given-name"
                  value={form.first_name}
                  error={Boolean(errors.first_name)}
                  onChange={(event) => set("first_name", event.target.value)}
                  placeholder="Jordan"
                />
              </Field>

              <Field
                label="Last name"
                htmlFor="signup-last-name"
                required
                error={errors.last_name}
              >
                <TextInput
                  id="signup-last-name"
                  autoComplete="family-name"
                  value={form.last_name}
                  error={Boolean(errors.last_name)}
                  onChange={(event) => set("last_name", event.target.value)}
                  placeholder="Ellis"
                />
              </Field>
            </div>

            <Field label="Email address" htmlFor="signup-email" required error={errors.email}>
              <TextInput
                id="signup-email"
                type="email"
                autoComplete="email"
                value={form.email}
                error={Boolean(errors.email)}
                onChange={(event) => set("email", event.target.value)}
                placeholder="you@example.com"
              />
            </Field>

            {isClient ? (
              <>
                <Field label="Phone" htmlFor="signup-phone" required error={errors.phone}>
                  <TextInput
                    id="signup-phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={form.phone}
                    error={Boolean(errors.phone)}
                    onChange={(event) => set("phone", formatPhoneInput(event.target.value))}
                    placeholder="(555) 123-4567"
                  />
                </Field>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="State" htmlFor="signup-state" required error={errors.state}>
                    <Select
                      id="signup-state"
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

                  <Field
                    label="ZIP code"
                    htmlFor="signup-zip"
                    hint="Optional"
                    error={errors.zip_code}
                  >
                    <TextInput
                      id="signup-zip"
                      inputMode="numeric"
                      autoComplete="postal-code"
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
              </>
            ) : null}

            <Field
              label="Password"
              htmlFor="signup-password"
              required
              error={errors.password}
              hint="At least 10 characters, mixing letters with numbers or symbols."
            >
              <PasswordInput
                id="signup-password"
                autoComplete="new-password"
                value={form.password}
                error={Boolean(errors.password)}
                onChange={(value) => set("password", value)}
                placeholder="••••••••••"
              />
            </Field>

            <Field
              label="Confirm password"
              htmlFor="signup-password-confirm"
              required
              error={errors.password_confirm}
            >
              <PasswordInput
                id="signup-password-confirm"
                autoComplete="new-password"
                value={form.password_confirm}
                error={Boolean(errors.password_confirm)}
                onChange={(value) => set("password_confirm", value)}
                placeholder="••••••••••"
              />
            </Field>

            <div className="space-y-1.5">
              <Checkbox
                checked={form.accept_terms}
                onChange={(value) => set("accept_terms", value)}
                error={Boolean(errors.accept_terms)}
              >
                I agree to the{" "}
                <Link
                  href="/legal/terms"
                  className="font-semibold text-brand-700 underline underline-offset-2"
                >
                  terms of service
                </Link>{" "}
                and{" "}
                <Link
                  href="/legal/privacy"
                  className="font-semibold text-brand-700 underline underline-offset-2"
                >
                  privacy policy
                </Link>
                .
              </Checkbox>
              {errors.accept_terms ? (
                <p className="text-sm text-red-600">{errors.accept_terms}</p>
              ) : null}
            </div>

            <Button type="submit" size="lg" loading={submitting} className="w-full">
              {isClient ? "Create my account" : "Request a specialist account"}
            </Button>
          </form>

          <ResultsDisclaimer className="mt-6" />
        </div>

        <p className="text-center text-xs text-muted">
          © {new Date().getFullYear()} Creditxora ·{" "}
          <Link href="/legal/privacy" className="underline underline-offset-2">
            Privacy
          </Link>
        </p>
      </div>

      {/* Brand side */}
      <div className="bg-navy-mesh bg-grid-faint relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-center lg:px-16">
        <div className="relative max-w-md">
          <ShieldCheck className="size-10 text-brand-400" aria-hidden />
          <h2 className="mt-6 font-display text-3xl font-extrabold leading-tight text-white">
            Start your credit review in minutes.
          </h2>
          <p className="mt-5 text-[1.0625rem] leading-relaxed text-navy-100/85">
            Creating an account opens your secure file. Upload your three credit reports and
            a specialist begins reviewing them for potential inaccuracies.
          </p>

          <ul className="mt-9 space-y-3">
            {[
              "Encrypted document upload",
              "Live dispute and bureau status",
              "Direct messaging with your specialist",
              "No obligation and no pressure to continue",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3">
                <CheckCircle2 className="size-4 shrink-0 text-brand-400" aria-hidden />
                <span className="text-[0.9375rem] text-navy-100/85">{item}</span>
              </li>
            ))}
          </ul>

          <p className="mt-12 text-xs leading-relaxed text-navy-200/70">
            Creditxora does not guarantee specific credit-score increases, deletions,
            approvals, or outcomes. Results vary by individual circumstances.
          </p>
        </div>
      </div>
    </div>
  );
}

/** Text input with a show/hide toggle, matching the sign-in screen. */
function PasswordInput({
  id,
  value,
  error,
  onChange,
  autoComplete,
  placeholder,
}: {
  id: string;
  value: string;
  error?: boolean;
  onChange: (value: string) => void;
  autoComplete?: string;
  placeholder?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <TextInput
        id={id}
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        value={value}
        error={error}
        onChange={(event) => onChange(event.target.value)}
        className="pr-12"
        placeholder={placeholder}
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-navy-400 transition hover:bg-navy-50 hover:text-navy-700"
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? (
          <EyeOff className="size-4" aria-hidden />
        ) : (
          <Eye className="size-4" aria-hidden />
        )}
      </button>
    </div>
  );
}

function PendingApproval({ message }: { message: string }) {
  return (
    <div className="flex min-h-dvh flex-col px-5 py-8 sm:px-10">
      <Link href="/" aria-label="Creditxora home">
        <Logo markClassName="h-8 w-8" />
      </Link>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-12 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          <MailCheck className="size-7" aria-hidden />
        </div>
        <h1 className="mt-6 font-display text-3xl font-extrabold text-navy-900">
          Request received
        </h1>
        <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">{message}</p>
        <ButtonLink href="/login" size="lg" className="mt-8">
          Go to sign in
        </ButtonLink>
        <Link
          href="/"
          className="mt-4 text-sm font-semibold text-brand-700 underline underline-offset-2"
        >
          Back to the website
        </Link>
      </div>
    </div>
  );
}
