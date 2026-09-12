"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { api } from "@/lib/api";
import type { PortalDashboard } from "@/lib/types";

type PortalState = {
  dashboard: PortalDashboard | null;
  loading: boolean;
  error: string | null;
  /** Re-fetch after an action that changes counts (upload, task, message). */
  refresh: () => Promise<void>;
};

const PortalContext = createContext<PortalState | null>(null);

export function PortalProvider({ children }: { children: React.ReactNode }) {
  const [dashboard, setDashboard] = useState<PortalDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setDashboard(await api.get<PortalDashboard>("/portal/dashboard", true));
      setError(null);
    } catch {
      setError("We couldn't load your file just now. Please refresh and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const value = useMemo(
    () => ({ dashboard, loading, error, refresh: load }),
    [dashboard, loading, error, load],
  );

  return <PortalContext.Provider value={value}>{children}</PortalContext.Provider>;
}

export function usePortal(): PortalState {
  const context = useContext(PortalContext);
  if (!context) throw new Error("usePortal must be used inside <PortalProvider>.");
  return context;
}
