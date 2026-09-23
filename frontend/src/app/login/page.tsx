"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { ArrowLeft, Eye, EyeOff, ShieldCheck } from "lucide-react";

import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { Field, TextInput } from "@/components/ui/Field";
import { Alert, Spinner } from "@/components/ui/Primitives";
import { ApiError } from "@/lib/api";
import { homeForRole, useAuth } from "@/lib/auth";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center">
          <Spinner className="size-7" />
        </div>
      }
    >
      <LoginView />
    </Suspense>
  );
}

function LoginView() {
  const { signIn, user, loading } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Already signed in? Don't show them a login form.
  useEffect(() => {
    if (!loading && user) router.replace(next || homeForRole(user.role));
  }, [loading, user, next, router]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const signedIn = await signIn(email.trim(), password);
      router.replace(next || homeForRole(signedIn.role));
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "We couldn't sign you in. Please check your connection and try again.",
      );
      setSubmitting(false);
    }
  };

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

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
          <h1 className="font-display text-3xl font-extrabold text-navy-900">
            Sign in to Creditxora
          </h1>
          <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">
            Access your client portal, documents and messages.
          </p>

          {error ? (
            <Alert tone="error" className="mt-6">
              {error}
            </Alert>
          ) : null}

          <form onSubmit={submit} className="mt-7 space-y-5" noValidate>
            <Field label="Email address" htmlFor="login-email" required>
              <TextInput
                id="login-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
              />
            </Field>

            <Field label="Password" htmlFor="login-password" required>
              <div className="relative">
                <TextInput
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="pr-12"
                  placeholder="••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-navy-400 transition hover:bg-navy-50 hover:text-navy-700"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" aria-hidden />
                  ) : (
                    <Eye className="size-4" aria-hidden />
                  )}
                </button>
              </div>
            </Field>

            <Button type="submit" size="lg" loading={submitting} className="w-full">
              Sign in
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-semibold text-brand-700 underline underline-offset-2"
            >
              Create one
            </Link>
          </p>
          <p className="mt-2 text-center text-sm text-muted">
            Not sure yet?{" "}
            <Link
              href="/get-started"
              className="font-semibold text-brand-700 underline underline-offset-2"
            >
              Get your credit assessment
            </Link>
          </p>
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
            Your file, your documents, your progress — in one secure place.
          </h2>
          <p className="mt-5 text-[1.0625rem] leading-relaxed text-navy-100/85">
            Creditxora clients can see every document uploaded, every item raised with a
            bureau, and every response received — without waiting on a callback.
          </p>

          <ul className="mt-9 space-y-3">
            {[
              "Encrypted document upload",
              "Live dispute and bureau status",
              "Direct messaging with your specialist",
              "Tasks, appointments and payment history",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3">
                <span className="size-1.5 rounded-full bg-brand-400" aria-hidden />
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
