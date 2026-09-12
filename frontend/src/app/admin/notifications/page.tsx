"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Bell, FileText, ListChecks, Mails, MessageSquare, UserRoundPlus } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Alert, EmptyState, LoadingPanel } from "@/components/ui/Primitives";
import { api } from "@/lib/api";
import { clsx } from "@/lib/clsx";
import { formatRelative } from "@/lib/format";

type AdminNotification = {
  id: string;
  title: string;
  body: string;
  kind: string;
  read: boolean;
  created_at: string;
  link: string | null;
};

const KIND_ICON: Record<string, React.ElementType> = {
  lead: UserRoundPlus,
  document: FileText,
  message: MessageSquare,
  task: ListChecks,
  contact: Mails,
};

export default function AdminNotificationsPage() {
  const [items, setItems] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [marking, setMarking] = useState(false);

  const load = useCallback(async () => {
    try {
      setItems(await api.get<AdminNotification[]>("/admin/notifications", true));
      setError(null);
    } catch {
      setError("We couldn't load notifications. Please refresh and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const markAllRead = async () => {
    setMarking(true);
    try {
      await api.post("/admin/notifications/read", undefined, true);
      setItems((current) => current.map((item) => ({ ...item, read: true })));
    } finally {
      setMarking(false);
    }
  };

  const unread = items.filter((item) => !item.read).length;

  if (loading) return <LoadingPanel label="Loading notifications…" />;
  if (error) return <Alert tone="error">{error}</Alert>;

  return (
    <div className="mx-auto max-w-3xl">
      <section className="card-surface p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold text-navy-900">
              Admin notifications
            </h2>
            <p className="text-sm text-muted">
              {unread > 0 ? `${unread} unread` : "Everything has been read"}
            </p>
          </div>
          {unread > 0 ? (
            <Button variant="outline" size="sm" onClick={markAllRead} loading={marking}>
              Mark all as read
            </Button>
          ) : null}
        </div>

        {items.length === 0 ? (
          <EmptyState
            className="mt-5"
            icon={<Bell className="size-5" />}
            title="No notifications yet"
            description="New assessments, document uploads and client messages appear here."
          />
        ) : (
          <ul className="mt-5 space-y-2">
            {items.map((item) => {
              const Icon = KIND_ICON[item.kind] ?? Bell;
              const row = (
                <div
                  className={clsx(
                    "flex items-start gap-3.5 rounded-xl border p-4 transition",
                    item.read ? "border-navy-100 bg-white" : "border-brand-200 bg-brand-50/50",
                  )}
                >
                  <span
                    className={clsx(
                      "flex size-9 shrink-0 items-center justify-center rounded-lg",
                      item.read ? "bg-navy-50 text-navy-500" : "bg-white text-brand-600",
                    )}
                  >
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 text-sm font-semibold text-navy-900">
                      {item.title}
                      {!item.read ? (
                        <span
                          className="size-1.5 shrink-0 rounded-full bg-brand-500"
                          aria-label="Unread"
                        />
                      ) : null}
                    </p>
                    <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-muted">
                      {item.body}
                    </p>
                    <p className="mt-1.5 text-xs text-muted">
                      {formatRelative(item.created_at)}
                    </p>
                  </div>
                </div>
              );

              return (
                <li key={item.id}>
                  {item.link ? (
                    <Link href={item.link} className="block">
                      {row}
                    </Link>
                  ) : (
                    row
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
