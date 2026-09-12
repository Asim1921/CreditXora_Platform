"use client";

import {
  Bell,
  FileText,
  Gavel,
  LayoutDashboard,
  ListChecks,
  MessageSquare,
} from "lucide-react";

import { AppShell, type NavItem } from "@/components/app/AppShell";
import { RouteGuard } from "@/components/app/RouteGuard";
import { PortalProvider, usePortal } from "@/components/portal/PortalContext";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard allow={["client"]}>
      <PortalProvider>
        <PortalChrome>{children}</PortalChrome>
      </PortalProvider>
    </RouteGuard>
  );
}

function PortalChrome({ children }: { children: React.ReactNode }) {
  const { dashboard } = usePortal();

  const nav: NavItem[] = [
    { href: "/portal", label: "Dashboard", icon: LayoutDashboard, exact: true },
    {
      href: "/portal/documents",
      label: "Documents",
      icon: FileText,
      badge: dashboard?.documents_count,
    },
    {
      href: "/portal/tasks",
      label: "Tasks",
      icon: ListChecks,
      badge: dashboard?.pending_tasks.length,
    },
    { href: "/portal/disputes", label: "Dispute history", icon: Gavel },
    {
      href: "/portal/messages",
      label: "Messages",
      icon: MessageSquare,
      badge: dashboard?.unread_messages,
    },
    {
      href: "/portal/notifications",
      label: "Notifications",
      icon: Bell,
      badge: dashboard?.unread_notifications,
    },
  ];

  const name = dashboard?.profile.first_name;

  return (
    <AppShell
      nav={nav}
      title={name ? `Welcome back, ${name}` : "Creditxora Dashboard"}
      subtitle={
        dashboard
          ? `${dashboard.profile.package} · Reference ${dashboard.profile.reference}`
          : undefined
      }
    >
      {children}
    </AppShell>
  );
}
