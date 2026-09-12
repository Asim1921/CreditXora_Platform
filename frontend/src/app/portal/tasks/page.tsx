"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Circle, ListChecks, Loader2 } from "lucide-react";

import { usePortal } from "@/components/portal/PortalContext";
import { Alert, Badge, EmptyState, LoadingPanel } from "@/components/ui/Primitives";
import { useToast } from "@/components/ui/Toast";
import { api } from "@/lib/api";
import { clsx } from "@/lib/clsx";
import { formatDate } from "@/lib/format";
import { isOverdue, useNow } from "@/lib/hooks";
import type { TaskItem } from "@/lib/types";

export default function PortalTasksPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const { refresh } = usePortal();
  const toast = useToast();

  const load = useCallback(async () => {
    try {
      setTasks(await api.get<TaskItem[]>("/portal/tasks", true));
      setError(null);
    } catch {
      setError("We couldn't load your tasks. Please refresh and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleDone = async (task: TaskItem) => {
    if (task.owner !== "client") return;
    setUpdating(task.id);
    const nextStatus = task.status === "done" ? "open" : "done";
    try {
      const updated = await api.patch<TaskItem>(
        `/portal/tasks/${task.id}`,
        { status: nextStatus },
        true,
      );
      setTasks((current) => current.map((item) => (item.id === task.id ? updated : item)));
      void refresh();
      if (nextStatus === "done") toast.success("Task marked complete");
    } catch {
      toast.error("Couldn't update that task", "Please try again.");
    } finally {
      setUpdating(null);
    }
  };

  const open = tasks.filter((task) => task.status !== "done");
  const done = tasks.filter((task) => task.status === "done");

  if (loading) return <LoadingPanel label="Loading your tasks…" />;
  if (error) return <Alert tone="error">{error}</Alert>;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section className="card-surface p-6">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-display text-lg font-bold text-navy-900">Open tasks</h2>
          <Badge tone={open.length ? "amber" : "brand"}>{open.length} open</Badge>
        </div>

        {open.length === 0 ? (
          <EmptyState
            className="mt-5"
            icon={<CheckCircle2 className="size-5" />}
            title="You're all caught up"
            description="Nothing is needed from you right now. Your specialist will add a task here when something is required."
          />
        ) : (
          <ul className="mt-5 space-y-3">
            {open.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                busy={updating === task.id}
                onToggle={() => toggleDone(task)}
              />
            ))}
          </ul>
        )}
      </section>

      {done.length ? (
        <section className="card-surface p-6">
          <h2 className="font-display text-lg font-bold text-navy-900">Completed</h2>
          <ul className="mt-5 space-y-3">
            {done.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                busy={updating === task.id}
                onToggle={() => toggleDone(task)}
              />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function TaskRow({
  task,
  busy,
  onToggle,
}: {
  task: TaskItem;
  busy: boolean;
  onToggle: () => void;
}) {
  const now = useNow();
  const done = task.status === "done";
  const clientOwned = task.owner === "client";
  const overdue = !done && isOverdue(task.due_at, now);

  return (
    <li
      className={clsx(
        "flex items-start gap-3 rounded-xl border p-4 transition",
        done ? "border-navy-100 bg-navy-50/40" : overdue ? "border-red-200" : "border-navy-100",
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        disabled={!clientOwned || busy}
        className={clsx(
          "mt-0.5 shrink-0 rounded-full transition",
          clientOwned ? "cursor-pointer hover:scale-105" : "cursor-default",
        )}
        aria-label={done ? `Reopen ${task.title}` : `Mark ${task.title} complete`}
      >
        {busy ? (
          <Loader2 className="size-6 animate-spin text-navy-300" aria-hidden />
        ) : done ? (
          <CheckCircle2 className="size-6 text-brand-600" aria-hidden />
        ) : (
          <Circle className="size-6 text-navy-300" aria-hidden />
        )}
      </button>

      <div className="min-w-0 flex-1">
        <p
          className={clsx(
            "text-sm font-semibold",
            done ? "text-muted line-through" : "text-navy-900",
          )}
        >
          {task.title}
        </p>
        {task.description ? (
          <p className="mt-1 text-sm leading-relaxed text-muted">{task.description}</p>
        ) : null}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {task.due_at ? (
            <span
              className={clsx(
                "text-xs font-medium",
                overdue ? "text-red-600" : "text-muted",
              )}
            >
              {overdue ? "Overdue — due " : "Due "}
              {formatDate(task.due_at)}
            </span>
          ) : null}
          {!clientOwned ? (
            <Badge tone="neutral">
              <ListChecks className="size-3" aria-hidden />
              Creditxora is handling this
            </Badge>
          ) : null}
        </div>
      </div>
    </li>
  );
}
