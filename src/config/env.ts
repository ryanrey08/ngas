/**
 * Centralised, typed access to public environment variables.
 * Every API URL in the app derives from here — never hardcode URLs elsewhere.
 */
export type ApiMode = "mock" | "real";

const mode = (process.env.NEXT_PUBLIC_API_MODE ?? "mock").toLowerCase();

export const env = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api",
  apiMode: (mode === "real" ? "real" : "mock") as ApiMode,
  apiTimeout: Number(process.env.NEXT_PUBLIC_API_TIMEOUT ?? 15000),
  appName: "NGAS",
  appFullName: "New Government Accounting System",
} as const;

export const isMockApi = env.apiMode === "mock";
