"use client";

import { Bell, LayoutDashboard, Mails, UserRoundPlus, Users } from "lucide-react";

import { AppShell, type NavItem } from "@/components/app/AppShell";
import { RouteGuard } from "@/components/app/RouteGuard";

const NAV: NavItem[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/leads", label: "Leads", icon: UserRoundPlus },
  { href: "/admin/clients", label: "Clients", icon: Users },
  { href: "/admin/notifications", label: "Notifications", icon: Bell },
  { href: "/admin/contact-requests", label: "Contact requests", icon: Mails },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard allow={["admin", "specialist"]}>
      <AppShell
        nav={NAV}
        accent="navy"
        title="Creditxora Admin"
        subtitle="Lead pipeline, client files and document review"
      >
        {children}
      </AppShell>
    </RouteGuard>
  );
}
