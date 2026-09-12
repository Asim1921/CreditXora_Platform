"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { Spinner } from "@/components/ui/Primitives";
import { homeForRole, useAuth } from "@/lib/auth";
import type { UserRole } from "@/lib/types";

/**
 * Client-side gate for the portal and admin areas.
 *
 * The API is the real authority — every protected endpoint checks the token and
 * the role server-side. This only keeps the wrong UI from flashing up.
 */
export function RouteGuard({
  allow,
  children,
}: {
  allow: UserRole[];
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (!allow.includes(user.role)) {
      router.replace(homeForRole(user.role));
    }
  }, [loading, user, allow, router, pathname]);

  if (loading || !user || !allow.includes(user.role)) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3">
        <Spinner className="size-7" />
        <p className="text-sm text-muted">Checking your session…</p>
      </div>
    );
  }

  return <>{children}</>;
}
