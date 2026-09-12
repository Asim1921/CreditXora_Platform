"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { api, tokenStore } from "@/lib/api";
import type { TokenPair, User } from "@/lib/types";

type AuthState = {
  user: User | null;
  /** True until the stored session has been checked on first mount. */
  loading: boolean;
  signIn: (email: string, password: string) => Promise<User>;
  signOut: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Rehydrate optimistically from storage, then confirm against the API so a
  // revoked or expired session doesn't linger in the UI.
  useEffect(() => {
    const cached = tokenStore.user<User>();
    if (cached) setUser(cached);

    if (!tokenStore.access()) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    api
      .get<User>("/auth/me", true)
      .then((fresh) => {
        if (!cancelled) setUser(fresh);
      })
      .catch(() => {
        if (!cancelled) {
          tokenStore.clear();
          setUser(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const tokens = await api.post<TokenPair>("/auth/login", { email, password });
    tokenStore.save(tokens.access_token, tokens.refresh_token, tokens.user);
    setUser(tokens.user);
    return tokens.user;
  }, []);

  const signOut = useCallback(() => {
    tokenStore.clear();
    setUser(null);
    router.push("/login");
  }, [router]);

  const refreshUser = useCallback(async () => {
    try {
      setUser(await api.get<User>("/auth/me", true));
    } catch {
      tokenStore.clear();
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading, signIn, signOut, refreshUser }),
    [user, loading, signIn, signOut, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>.");
  return context;
}

/** Where a signed-in user belongs after authenticating. */
export function homeForRole(role: User["role"]): string {
  return role === "client" ? "/portal" : "/admin";
}
