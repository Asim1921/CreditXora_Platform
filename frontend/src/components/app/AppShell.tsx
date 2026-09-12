"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown, LogOut, Menu, X, type LucideIcon } from "lucide-react";

import { Logo } from "@/components/brand/Logo";
import { useAuth } from "@/lib/auth";
import { clsx } from "@/lib/clsx";
import { initials } from "@/lib/format";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Rendered as a count pill when greater than zero. */
  badge?: number;
  exact?: boolean;
};

export function AppShell({
  nav,
  title,
  subtitle,
  actions,
  children,
  accent = "brand",
}: {
  nav: NavItem[];
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  accent?: "brand" | "navy";
}) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Overlays close from the interaction that navigates, rather than from an
  // effect watching the pathname — no cascading render after each route change.
  const closeOverlays = () => {
    setSidebarOpen(false);
    setMenuOpen(false);
  };

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center justify-between px-5">
        <Link href="/" aria-label="Creditxora home" onClick={closeOverlays}>
          <Logo theme="dark" markClassName="h-8 w-8" />
        </Link>
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="rounded-lg p-1.5 text-navy-200 transition hover:bg-white/10 lg:hidden"
          aria-label="Close navigation"
        >
          <X className="size-5" />
        </button>
      </div>

      <nav className="scroll-slim flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Sections">
        {nav.map((item) => {
          const active = isActive(item);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeOverlays}
              aria-current={active ? "page" : undefined}
              className={clsx(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                active
                  ? accent === "brand"
                    ? "bg-brand-600 text-white shadow-[0_8px_20px_-10px_rgb(22_135_60/0.9)]"
                    : "bg-white/12 text-white"
                  : "text-navy-100/75 hover:bg-white/8 hover:text-white",
              )}
            >
              <Icon className="size-[1.15rem] shrink-0" aria-hidden />
              <span className="flex-1 truncate">{item.label}</span>
              {item.badge ? (
                <span
                  className={clsx(
                    "min-w-5 rounded-full px-1.5 py-0.5 text-center text-[0.6875rem] font-bold",
                    active ? "bg-white/25 text-white" : "bg-brand-500 text-white",
                  )}
                >
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-white/10 p-3">
        <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
            {initials(user?.first_name, user?.last_name)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="truncate text-xs capitalize text-navy-200/70">{user?.role}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={signOut}
          className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-navy-100/75 transition hover:bg-white/8 hover:text-white"
        >
          <LogOut className="size-[1.15rem]" aria-hidden />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-sand-50">
      {/* Desktop sidebar */}
      <aside className="bg-navy-950 fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">
        {sidebar}
      </aside>

      {/* Mobile sidebar */}
      {sidebarOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-navy-950/50 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation"
          />
          <aside className="bg-navy-950 absolute inset-y-0 left-0 w-72 animate-fade-in shadow-2xl">
            {sidebar}
          </aside>
        </div>
      ) : null}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-navy-100 bg-white/90 backdrop-blur-xl">
          <div className="flex min-h-16 flex-wrap items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl border border-navy-100 text-navy-700 transition hover:bg-navy-50 lg:hidden"
              aria-label="Open navigation"
            >
              <Menu className="size-5" />
            </button>

            <div className="min-w-0 flex-1">
              <h1 className="truncate font-display text-lg font-bold text-navy-900">
                {title}
              </h1>
              {subtitle ? (
                <p className="truncate text-sm text-muted">{subtitle}</p>
              ) : null}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {actions}
              <div className="relative hidden sm:block">
                <button
                  type="button"
                  onClick={() => setMenuOpen((open) => !open)}
                  aria-expanded={menuOpen}
                  className="flex items-center gap-2 rounded-xl border border-navy-100 py-1.5 pl-1.5 pr-2.5 transition hover:bg-navy-50"
                >
                  <span className="flex size-7 items-center justify-center rounded-lg bg-navy-800 text-[0.625rem] font-bold text-white">
                    {initials(user?.first_name, user?.last_name)}
                  </span>
                  <ChevronDown className="size-3.5 text-navy-400" aria-hidden />
                </button>

                {menuOpen ? (
                  <div className="absolute right-0 top-full z-40 mt-2 w-56 animate-fade-in rounded-xl border border-navy-100 bg-white p-1.5 shadow-lift">
                    <div className="px-3 py-2">
                      <p className="truncate text-sm font-semibold text-navy-900">
                        {user?.first_name} {user?.last_name}
                      </p>
                      <p className="truncate text-xs text-muted">{user?.email}</p>
                    </div>
                    <hr className="my-1 border-navy-100" />
                    <Link
                      href="/"
                      onClick={closeOverlays}
                      className="block rounded-lg px-3 py-2 text-sm text-navy-700 transition hover:bg-navy-50"
                    >
                      Back to website
                    </Link>
                    <button
                      type="button"
                      onClick={signOut}
                      className="block w-full rounded-lg px-3 py-2 text-left text-sm text-navy-700 transition hover:bg-navy-50"
                    >
                      Sign out
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </header>

        <main id="main" className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
