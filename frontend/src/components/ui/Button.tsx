import Link from "next/link";
import { Loader2 } from "lucide-react";

import { clsx } from "@/lib/clsx";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "danger" | "onDark";
type Size = "sm" | "md" | "lg";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold " +
  "transition-all duration-200 disabled:pointer-events-none disabled:opacity-55 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-brand-600 text-white shadow-[0_10px_24px_-10px_rgb(22_135_60/0.8)] " +
    "hover:bg-brand-700 hover:shadow-[0_14px_32px_-12px_rgb(22_135_60/0.85)] " +
    "active:translate-y-px focus-visible:outline-brand-600",
  secondary:
    "bg-navy-800 text-white shadow-[0_10px_24px_-12px_rgb(17_36_69/0.9)] " +
    "hover:bg-navy-900 active:translate-y-px focus-visible:outline-navy-800",
  outline:
    "border border-navy-200 bg-white text-navy-800 hover:border-navy-300 " +
    "hover:bg-navy-50 active:translate-y-px focus-visible:outline-navy-500",
  ghost: "text-navy-700 hover:bg-navy-50 focus-visible:outline-navy-500",
  danger:
    "bg-red-600 text-white hover:bg-red-700 active:translate-y-px focus-visible:outline-red-600",
  onDark:
    "bg-white/10 text-white ring-1 ring-inset ring-white/25 backdrop-blur " +
    "hover:bg-white/18 active:translate-y-px focus-visible:outline-white",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-[0.9375rem]",
  lg: "h-13 px-7 text-base",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  className?: string;
  children: React.ReactNode;
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className,
  children,
  disabled,
  ...rest
}: CommonProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={clsx(BASE, VARIANTS[variant], SIZES[size], className)}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  children,
  href,
  ...rest
}: CommonProps & { href: string } & Omit<
    React.ComponentProps<typeof Link>,
    "href" | "className" | "children"
  >) {
  return (
    <Link
      href={href}
      className={clsx(BASE, VARIANTS[variant], SIZES[size], className)}
      {...rest}
    >
      {children}
    </Link>
  );
}
