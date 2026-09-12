"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

import { clsx } from "@/lib/clsx";

type ToastKind = "success" | "error" | "info";
type Toast = { id: number; kind: ToastKind; title: string; body?: string };

type ToastApi = {
  success: (title: string, body?: string) => void;
  error: (title: string, body?: string) => void;
  info: (title: string, body?: string) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

const ICONS: Record<ToastKind, React.ElementType> = {
  success: CheckCircle2,
  error: AlertTriangle,
  info: Info,
};

const ACCENTS: Record<ToastKind, string> = {
  success: "text-brand-600",
  error: "text-red-600",
  info: "text-navy-600",
};

let nextId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (kind: ToastKind, title: string, body?: string) => {
      const id = nextId++;
      setToasts((current) => [...current, { id, kind, title, body }]);
      window.setTimeout(() => dismiss(id), kind === "error" ? 7000 : 4500);
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(
    () => ({
      success: (title, body) => push("success", title, body),
      error: (title, body) => push("error", title, body),
      info: (title, body) => push("info", title, body),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-4 bottom-4 z-[90] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-6 sm:items-end"
        role="status"
        aria-live="polite"
      >
        {toasts.map((toast) => {
          const Icon = ICONS[toast.kind];
          return (
            <div
              key={toast.id}
              className="pointer-events-auto flex w-full max-w-sm animate-fade-up items-start gap-3 rounded-2xl border border-navy-100 bg-white p-4 shadow-lift"
            >
              <Icon className={clsx("mt-0.5 size-5 shrink-0", ACCENTS[toast.kind])} aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-navy-900">{toast.title}</p>
                {toast.body ? (
                  <p className="mt-0.5 text-sm text-muted">{toast.body}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                className="rounded-md p-1 text-navy-300 transition hover:bg-navy-50 hover:text-navy-600"
                aria-label="Dismiss notification"
              >
                <X className="size-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside <ToastProvider>.");
  return context;
}
