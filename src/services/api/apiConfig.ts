import { env } from "@/config/env";

/**
 * Single place that decides where a request goes. Pages and components never check the mode:
 * they call generated RTK Query hooks, and the base query routes each request here.
 */
export const apiConfig = {
  mode: env.apiMode,
  baseUrl: env.apiBaseUrl,
  timeout: env.apiTimeout,
  realResources: env.realResources,
  mock: { delayMs: env.mockDelayMs, failureRate: env.mockFailureRate },
} as const;

/** Path without query string or leading slash, e.g. "journal-entries/je-1/reverse". */
export function resourcePath(url: string): string {
  return url.split("?")[0].replace(/^\/+/, "");
}

/** True when this request should be answered by the in-browser mock API. */
export function shouldMock(url: string): boolean {
  if (apiConfig.mode === "real") return false;
  const path = resourcePath(url);
  return !apiConfig.realResources.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}
