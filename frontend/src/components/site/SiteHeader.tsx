"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronDown, LayoutDashboard, Menu, Phone, X } from "lucide-react";

import { Logo } from "@/components/brand/Logo";
import { ButtonLink } from "@/components/ui/Button";
import { useAuth, homeForRole } from "@/lib/auth";
import { clsx } from "@/lib/clsx";
import { MAIN_NAV, SERVICES } from "@/lib/content";

export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Overlays close from the click that navigates rather than from an effect
  // watching the pathname, which would re-render the whole header again.
  const closeOverlays = () => {
    setMobileOpen(false);
    setServicesOpen(false);
  };

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      {/* Utility strip */}
      <div className="hidden bg-navy-900 text-navy-100 lg:block">
        <div className="container-page flex h-9 items-center justify-between text-xs">
          <p className="flex items-center gap-2">
            <span className="inline-flex size-1.5 rounded-full bg-brand-400" aria-hidden />
            Credit report review, dispute support and credit-building guidance for U.S. consumers
          </p>
          <div className="flex items-center gap-5">
            <a
              href="tel:+18885550137"
              className="inline-flex items-center gap-1.5 transition hover:text-white"
            >
              <Phone className="size-3" aria-hidden />
              (888) 555-0137
            </a>
            <Link href="/login" className="font-semibold transition hover:text-white">
              Client sign in
            </Link>
            <Link href="/signup" className="font-semibold transition hover:text-white">
              Create account
            </Link>
          </div>
        </div>
      </div>

      <header
        className={clsx(
          "sticky top-0 z-50 transition-all duration-300",
          scrolled
            ? "border-b border-navy-100 bg-white/85 backdrop-blur-xl shadow-[0_1px_20px_-8px_rgb(16_36_69/0.25)]"
            : "border-b border-transparent bg-white",
        )}
      >
        <div className="container-page flex h-18 items-center justify-between gap-4 py-3">
          <Link href="/" aria-label="Creditxora home" className="shrink-0" onClick={closeOverlays}>
            <Logo />
          </Link>

          <nav className="hidden items-center gap-0.5 xl:flex" aria-label="Main">
            {MAIN_NAV.map((item) =>
              item.href === "/services" ? (
                <div
                  key={item.href}
                  className="relative"
                  onMouseEnter={() => setServicesOpen(true)}
                  onMouseLeave={() => setServicesOpen(false)}
                >
                  <Link
                    href={item.href}
                    aria-expanded={servicesOpen}
                    className={clsx(
                      "inline-flex items-center gap-1 rounded-lg px-3 py-2 text-[0.9375rem] font-medium transition",
                      isActive(item.href)
                        ? "text-brand-700"
                        : "text-navy-700 hover:bg-navy-50 hover:text-navy-900",
                    )}
                  >
                    {item.label}
                    <ChevronDown
                      className={clsx(
                        "size-3.5 transition-transform",
                        servicesOpen && "rotate-180",
                      )}
                      aria-hidden
                    />
                  </Link>

                  {servicesOpen ? (
                    <div className="absolute left-1/2 top-full w-[44rem] -translate-x-1/2 pt-3">
                      <div className="animate-fade-in rounded-2xl border border-navy-100 bg-white p-3 shadow-lift">
                        <div className="grid grid-cols-2 gap-1">
                          {SERVICES.slice(0, 10).map((service) => (
                            <Link
                              key={service.slug}
                              href={`/services/${service.slug}`}
                              onClick={closeOverlays}
                              className="rounded-xl px-3 py-2.5 transition hover:bg-navy-50"
                            >
                              <span className="block text-sm font-semibold text-navy-800">
                                {service.title}
                              </span>
                              <span className="mt-0.5 line-clamp-1 block text-xs text-muted">
                                {service.short}
                              </span>
                            </Link>
                          ))}
                        </div>
                        <Link
                          href="/services"
                          onClick={closeOverlays}
                          className="mt-2 flex items-center justify-center rounded-xl bg-navy-50 px-3 py-2.5 text-sm font-semibold text-navy-800 transition hover:bg-navy-100"
                        >
                          View all 12 services
                        </Link>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeOverlays}
                  className={clsx(
                    "rounded-lg px-3 py-2 text-[0.9375rem] font-medium transition",
                    isActive(item.href)
                      ? "text-brand-700"
                      : "text-navy-700 hover:bg-navy-50 hover:text-navy-900",
                  )}
                >
                  {item.label}
                </Link>
              ),
            )}
          </nav>

          <div className="flex items-center gap-2">
            {user ? (
              <ButtonLink
                href={homeForRole(user.role)}
                variant="outline"
                size="sm"
                className="hidden sm:inline-flex"
              >
                <LayoutDashboard className="size-4" aria-hidden />
                {user.role === "client" ? "My portal" : "Dashboard"}
              </ButtonLink>
            ) : (
              <ButtonLink
                href="/login"
                variant="ghost"
                size="sm"
                className="hidden xl:inline-flex"
              >
                Sign in
              </ButtonLink>
            )}
            <ButtonLink href="/get-started" size="sm" className="hidden sm:inline-flex">
              Get Started
            </ButtonLink>
            <button
              type="button"
              onClick={() => setMobileOpen((open) => !open)}
              className="inline-flex size-10 items-center justify-center rounded-xl border border-navy-100 text-navy-800 transition hover:bg-navy-50 xl:hidden"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-[60] xl:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-navy-950/45 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          />
          <div className="absolute inset-y-0 right-0 flex w-[min(22rem,88vw)] animate-fade-in flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-navy-100 px-5 py-4">
              <Logo markClassName="h-8 w-8" />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="inline-flex size-9 items-center justify-center rounded-xl text-navy-600 transition hover:bg-navy-50"
                aria-label="Close menu"
              >
                <X className="size-5" />
              </button>
            </div>

            <nav className="scroll-slim flex-1 overflow-y-auto px-3 py-4" aria-label="Mobile">
              {MAIN_NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeOverlays}
                  className={clsx(
                    "block rounded-xl px-4 py-3 text-base font-medium transition",
                    isActive(item.href)
                      ? "bg-brand-50 text-brand-700"
                      : "text-navy-800 hover:bg-navy-50",
                  )}
                >
                  {item.label}
                </Link>
              ))}
              <div className="mt-3 border-t border-navy-100 pt-3">
                <p className="px-4 pb-1 text-xs font-bold uppercase tracking-widest text-muted">
                  Popular services
                </p>
                {SERVICES.slice(0, 5).map((service) => (
                  <Link
                    key={service.slug}
                    href={`/services/${service.slug}`}
                    onClick={closeOverlays}
                    className="block rounded-xl px-4 py-2.5 text-sm text-navy-700 transition hover:bg-navy-50"
                  >
                    {service.title}
                  </Link>
                ))}
              </div>
            </nav>

            <div className="space-y-2 border-t border-navy-100 p-4">
              <ButtonLink href="/get-started" className="w-full" size="lg">
                Get Started
              </ButtonLink>
              <ButtonLink
                href={user ? homeForRole(user.role) : "/login"}
                variant="outline"
                className="w-full"
              >
                {user ? "Go to my dashboard" : "Client sign in"}
              </ButtonLink>
              {user ? null : (
                <ButtonLink href="/signup" variant="ghost" className="w-full">
                  Create an account
                </ButtonLink>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
