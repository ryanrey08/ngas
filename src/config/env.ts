/**
 * Centralised, typed access to PUBLIC environment variables (safe in the browser).
 * Server-only settings (the backend URL) live in src/lib/server/backend.ts.
 */
export type ApiMode = "mock" | "real";

const mode = (process.env.NEXT_PUBLIC_API_MODE ?? "mock").toLowerCase();

export const env = {
  /**
   * Base URL the BROWSER calls. Defaults to the same-origin proxy in src/app/api/backend,
   * which forwards to the eNGAS backend and attaches the bearer token from an httpOnly cookie.
   */
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api/backend",
  /** Data modules without backend endpoints yet (journals, COA, …) use mock data in "mock" mode. Auth is always real. */
  apiMode: (mode === "real" ? "real" : "mock") as ApiMode,
  apiTimeout: Number(process.env.NEXT_PUBLIC_API_TIMEOUT ?? 15000),
  appName: "NGAS",
  appFullName: "New Government Accounting System",
} as const;

export const isMockApi = env.apiMode === "mock";
