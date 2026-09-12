"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, Home, LayoutGrid, Mail, Sparkles } from "lucide-react";

import { clsx } from "@/lib/clsx";

const ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/services", label: "Services", icon: LayoutGrid },
  { href: "/get-started", label: "Get Started", icon: Sparkles, primary: true },
  { href: "/contact", label: "Contact", icon: Mail },
];

/**
 * Mobile bottom bar plus a floating Get Started button — most Creditxora
 * traffic arrives from social apps on a phone, so the primary action is always
 * within thumb reach.
 */
export function MobileActionBar() {
  const pathname = usePathname();
  const [showFloating, setShowFloating] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowFloating(window.scrollY > 700);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const onWizard = pathname.startsWith("/get-started");

  return (
    <>
      {!onWizard && showFloating ? (
        <Link
          href="/get-started"
          className="fixed bottom-24 right-4 z-40 inline-flex animate-fade-up items-center gap-2 rounded-full bg-brand-600 px-5 py-3.5 text-sm font-bold text-white shadow-glow transition hover:bg-brand-700 lg:bottom-8"
        >
          Get Started
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      ) : null}

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-navy-100 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
        aria-label="Quick actions"
      >
        <div className="grid grid-cols-4">
          {ITEMS.map((item) => {
            const active =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex flex-col items-center gap-1 py-2.5 text-[0.6875rem] font-semibold transition",
                  item.primary
                    ? "text-brand-700"
                    : active
                      ? "text-navy-900"
                      : "text-muted hover:text-navy-800",
                )}
              >
                <span
                  className={clsx(
                    "flex size-9 items-center justify-center rounded-xl transition",
                    item.primary
                      ? "bg-brand-600 text-white shadow-[0_8px_18px_-8px_rgb(22_135_60/0.9)]"
                      : active
                        ? "bg-navy-50"
                        : "",
                  )}
                >
                  <Icon className="size-[1.15rem]" aria-hidden />
                </span>
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
