import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function PageHero({
  eyebrow,
  title,
  description,
  breadcrumbs,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  breadcrumbs?: { href: string; label: string }[];
  children?: React.ReactNode;
}) {
  return (
    <section className="bg-navy-mesh bg-grid-faint relative isolate overflow-hidden">
      <div className="container-page relative py-14 lg:py-20">
        {breadcrumbs?.length ? (
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex flex-wrap items-center gap-1 text-xs text-navy-200/75">
              <li>
                <Link href="/" className="transition hover:text-white">
                  Home
                </Link>
              </li>
              {breadcrumbs.map((crumb, index) => (
                <li key={crumb.href} className="flex items-center gap-1">
                  <ChevronRight className="size-3" aria-hidden />
                  {index === breadcrumbs.length - 1 ? (
                    <span className="text-white">{crumb.label}</span>
                  ) : (
                    <Link href={crumb.href} className="transition hover:text-white">
                      {crumb.label}
                    </Link>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        ) : null}

        <div className="max-w-3xl animate-fade-up">
          {eyebrow ? (
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-brand-300">
              <span className="h-px w-6 bg-current opacity-60" aria-hidden />
              {eyebrow}
            </span>
          ) : null}
          <h1 className="mt-4 font-display text-[2.25rem] font-extrabold leading-[1.1] text-white sm:text-5xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-5 text-lg leading-relaxed text-navy-100/85">{description}</p>
          ) : null}
          {children ? <div className="mt-8">{children}</div> : null}
        </div>
      </div>
    </section>
  );
}
