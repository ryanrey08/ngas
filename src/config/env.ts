/**
 * Centralised, typed access to PUBLIC environment variables (safe in the browser — never put
 * secrets in NEXT_PUBLIC_*). Server-only settings (the backend URL) live in src/lib/server/backend.ts.
 */
export type ApiMode = "mock" | "real";

const mode = (process.env.NEXT_PUBLIC_API_MODE ?? "mock").toLowerCase();

const list = (v: string | undefined) =>
  (v ?? "")
    .split(",")
    .map((s) => s.trim().replace(/^\/+|\/+$/g, ""))
    .filter(Boolean);

export const env = {
  /**
   * Base URL the BROWSER calls. Defaults to the same-origin proxy in src/app/api/backend,
   * which forwards to the eNGAS backend and attaches the bearer token from an httpOnly cookie.
   */
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api/backend",
  /** "mock" serves module data from src/mocks; "real" sends every request to the backend. Auth is always real. */
  apiMode: (mode === "real" ? "real" : "mock") as ApiMode,
  apiTimeout: Number(process.env.NEXT_PUBLIC_API_TIMEOUT ?? 15000),
  /**
   * In mock mode, resource path prefixes that should still go to the real backend
   * (e.g. "users,roles,permissions", which the eNGAS backend already serves).
   */
  realResources: list(process.env.NEXT_PUBLIC_API_REAL_RESOURCES),
  /** Simulated latency of the mock API in ms (a random 0–50% jitter is added). */
  mockDelayMs: Number(process.env.NEXT_PUBLIC_MOCK_DELAY_MS ?? 350),
  /** Probability (0–1) that a mock request fails with a 500, for exercising error states. */
  mockFailureRate: Math.min(1, Math.max(0, Number(process.env.NEXT_PUBLIC_MOCK_FAILURE_RATE ?? 0))),
  appName: "NGAS",
  appFullName: "New Government Accounting System",
} as const;

export const isMockApi = env.apiMode === "mock";
