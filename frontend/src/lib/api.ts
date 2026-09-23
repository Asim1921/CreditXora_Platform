/**
 * Thin typed client for the Creditxora FastAPI backend.
 *
 * Access tokens are short-lived (30 min by default) and a 401 triggers exactly
 * one transparent refresh attempt before the caller sees an error, so a user
 * working through a long form is never dumped back to the sign-in screen.
 */

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:8000";

const API_PREFIX = "/api/v1";

const ACCESS_KEY = "cx.access";
const REFRESH_KEY = "cx.refresh";
const USER_KEY = "cx.user";

export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors: Record<string, string>;

  constructor(message: string, status: number, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

// --- token storage ---------------------------------------------------------

const isBrowser = () => typeof window !== "undefined";

export const tokenStore = {
  access: () => (isBrowser() ? window.localStorage.getItem(ACCESS_KEY) : null),
  refresh: () => (isBrowser() ? window.localStorage.getItem(REFRESH_KEY) : null),
  user: <T,>(): T | null => {
    if (!isBrowser()) return null;
    const raw = window.localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },
  save(access: string, refresh: string, user: unknown) {
    if (!isBrowser()) return;
    window.localStorage.setItem(ACCESS_KEY, access);
    window.localStorage.setItem(REFRESH_KEY, refresh);
    window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clear() {
    if (!isBrowser()) return;
    window.localStorage.removeItem(ACCESS_KEY);
    window.localStorage.removeItem(REFRESH_KEY);
    window.localStorage.removeItem(USER_KEY);
  },
};

// --- core fetch ------------------------------------------------------------

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  auth?: boolean;
  formData?: FormData;
  signal?: AbortSignal;
};

// Concurrent 401s share one refresh round-trip rather than racing.
let refreshInFlight: Promise<boolean> | null = null;

async function runRefresh(): Promise<boolean> {
  const refresh = tokenStore.refresh();
  if (!refresh) return false;

  try {
    const response = await fetch(`${API_BASE}${API_PREFIX}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refresh }),
    });
    if (!response.ok) {
      tokenStore.clear();
      return false;
    }
    const data = await response.json();
    tokenStore.save(data.access_token, data.refresh_token, data.user);
    return true;
  } catch {
    return false;
  }
}

async function refreshTokens(): Promise<boolean> {
  refreshInFlight ??= runRefresh().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

async function parseError(response: Response): Promise<ApiError> {
  let message = "Something went wrong. Please try again.";
  const fieldErrors: Record<string, string> = {};
  try {
    const data = await response.json();
    if (typeof data?.detail === "string") message = data.detail;
    if (Array.isArray(data?.errors)) {
      for (const entry of data.errors) {
        if (entry?.field) fieldErrors[entry.field] = entry.message ?? "Invalid value.";
      }
    }
  } catch {
    /* non-JSON error body — keep the default message */
  }
  if (response.status === 401 && message.startsWith("Something")) {
    message = "Please sign in to continue.";
  }
  return new ApiError(message, response.status, fieldErrors);
}

async function request<T>(path: string, options: RequestOptions = {}, retry = true): Promise<T> {
  const { method = "GET", body, auth = false, formData, signal } = options;

  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth) {
    const token = tokenStore.access();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${API_PREFIX}${path}`, {
    method,
    headers,
    body: formData ?? (body !== undefined ? JSON.stringify(body) : undefined),
    signal,
  });

  if (response.status === 401 && auth && retry) {
    if (await refreshTokens()) {
      return request<T>(path, options, false);
    }
    tokenStore.clear();
  }

  if (!response.ok) throw await parseError(response);
  if (response.status === 204) return undefined as T;

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return (await response.text()) as T;
  return (await response.json()) as T;
}

export const api = {
  get: <T,>(path: string, auth = false, signal?: AbortSignal) =>
    request<T>(path, { method: "GET", auth, signal }),
  post: <T,>(path: string, body?: unknown, auth = false) =>
    request<T>(path, { method: "POST", body, auth }),
  patch: <T,>(path: string, body?: unknown, auth = false) =>
    request<T>(path, { method: "PATCH", body, auth }),
  del: <T,>(path: string, auth = false) => request<T>(path, { method: "DELETE", auth }),
  upload: <T,>(path: string, formData: FormData) =>
    request<T>(path, { method: "POST", formData, auth: true }),
  /** Fetch a protected binary (an encrypted document) as an object URL. */
  async download(path: string): Promise<Blob> {
    const token = tokenStore.access();
    const response = await fetch(`${API_BASE}${API_PREFIX}${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (response.status === 401 && (await refreshTokens())) {
      return api.download(path);
    }
    if (!response.ok) throw await parseError(response);
    return response.blob();
  },
};
