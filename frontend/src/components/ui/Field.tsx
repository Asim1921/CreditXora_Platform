"use client";

import { useId } from "react";
import { AlertCircle, Check, ChevronDown } from "lucide-react";

import { clsx } from "@/lib/clsx";

const CONTROL =
  "w-full rounded-xl border bg-white px-4 text-[0.9375rem] text-ink transition " +
  "placeholder:text-navy-300 focus:outline-none focus:ring-4 disabled:bg-navy-50 " +
  "disabled:text-muted";

const CONTROL_OK =
  "border-navy-200 hover:border-navy-300 focus:border-brand-500 focus:ring-brand-100";
const CONTROL_ERR = "border-red-400 focus:border-red-500 focus:ring-red-100";

export function Field({
  label,
  hint,
  error,
  required,
  children,
  htmlFor,
  className,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  htmlFor?: string;
  className?: string;
}) {
  return (
    <div className={clsx("flex flex-col gap-1.5", className)}>
      <label
        htmlFor={htmlFor}
        className="text-sm font-semibold text-navy-800"
      >
        {label}
        {required ? <span className="ml-0.5 text-brand-600">*</span> : null}
      </label>
      {children}
      {error ? (
        <p className="flex items-start gap-1.5 text-sm text-red-600">
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      ) : hint ? (
        <p className="text-sm text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export function TextInput({
  error,
  className,
  ...rest
}: { error?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={clsx(CONTROL, "h-12", error ? CONTROL_ERR : CONTROL_OK, className)}
      aria-invalid={error || undefined}
      {...rest}
    />
  );
}

export function TextArea({
  error,
  className,
  ...rest
}: { error?: boolean } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={clsx(CONTROL, "min-h-28 py-3 leading-relaxed", error ? CONTROL_ERR : CONTROL_OK, className)}
      aria-invalid={error || undefined}
      {...rest}
    />
  );
}

export function Select({
  error,
  className,
  children,
  ...rest
}: { error?: boolean } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        className={clsx(
          CONTROL,
          "h-12 appearance-none pr-10",
          error ? CONTROL_ERR : CONTROL_OK,
          className,
        )}
        aria-invalid={error || undefined}
        {...rest}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-navy-400"
        aria-hidden
      />
    </div>
  );
}

/** Large tappable card used for the assessment's multi-select answers. */
export function OptionCard({
  checked,
  onToggle,
  title,
  description,
  type = "checkbox",
  name,
  icon,
}: {
  checked: boolean;
  onToggle: () => void;
  title: string;
  description?: string;
  type?: "checkbox" | "radio";
  name?: string;
  icon?: React.ReactNode;
}) {
  const id = useId();
  return (
    <label
      htmlFor={id}
      className={clsx(
        "group relative flex cursor-pointer items-start gap-3 rounded-2xl border-2 p-4 transition-all duration-200",
        checked
          ? "border-brand-500 bg-brand-50/70 shadow-[0_8px_24px_-14px_rgb(22_135_60/0.6)]"
          : "border-navy-100 bg-white hover:border-navy-300 hover:bg-navy-50/50",
      )}
    >
      <input
        id={id}
        type={type}
        name={name}
        checked={checked}
        onChange={onToggle}
        className="sr-only"
      />
      <span
        className={clsx(
          "mt-0.5 flex size-5 shrink-0 items-center justify-center border-2 transition-all",
          type === "radio" ? "rounded-full" : "rounded-md",
          checked
            ? "border-brand-600 bg-brand-600 text-white"
            : "border-navy-200 bg-white group-hover:border-navy-300",
        )}
        aria-hidden
      >
        {checked ? (
          type === "radio" ? (
            <span className="size-2 rounded-full bg-white" />
          ) : (
            <Check className="size-3.5" strokeWidth={3} />
          )
        ) : null}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 text-[0.9375rem] font-semibold text-navy-800">
          {icon}
          {title}
        </span>
        {description ? (
          <span className="mt-0.5 block text-sm text-muted">{description}</span>
        ) : null}
      </span>
    </label>
  );
}

export function Checkbox({
  checked,
  onChange,
  children,
  error,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  children: React.ReactNode;
  error?: boolean;
}) {
  const id = useId();
  return (
    <label
      htmlFor={id}
      className={clsx(
        "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition",
        error ? "border-red-300 bg-red-50/50" : "border-navy-100 bg-navy-50/40 hover:bg-navy-50",
      )}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="sr-only"
      />
      <span
        className={clsx(
          "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border-2 transition",
          checked ? "border-brand-600 bg-brand-600 text-white" : "border-navy-300 bg-white",
        )}
        aria-hidden
      >
        {checked ? <Check className="size-3.5" strokeWidth={3} /> : null}
      </span>
      <span className="text-sm leading-relaxed text-muted">{children}</span>
    </label>
  );
}
