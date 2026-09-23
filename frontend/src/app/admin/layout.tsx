"use client";

import {
  Bell,
  LayoutDashboard,
  Mails,
  UserRoundCog,
  UserRoundPlus,
  Users,
} from "lucide-react";

import { AppShell, type NavItem } from "@/components/app/AppShell";
import { RouteGuard } from "@/components/app/RouteGuard";
import { useAuth } from "@/lib/auth";

const NAV: NavItem[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/leads", label: "Leads", icon: UserRoundPlus },
  { href: "/admin/clients", label: "Clients", icon: Users },
  { href: "/admin/notifications", label: "Notifications", icon: Bell },
  { href: "/admin/contact-requests", label: "Contact requests", icon: Mails },
];

// Approving staff is an administrator action, so specialists aren't sent to a
// screen whose buttons the API would refuse.
const STAFF_NAV: NavItem = { href: "/admin/staff", label: "Staff", icon: UserRoundCog };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const nav = user?.role === "admin" ? [...NAV, STAFF_NAV] : NAV;

  return (
    <RouteGuard allow={["admin", "specialist"]}>
      <AppShell
        nav={nav}
        accent="navy"
        title="Creditxora Admin"
        subtitle="Lead pipeline, client files and document review"
      >
        {children}
      </AppShell>
    </RouteGuard>
  );
}
