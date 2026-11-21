import type { FetchArgs } from "@reduxjs/toolkit/query";
import type { ApiBaseQuery } from "@/services/api/baseQuery";
import { apiConfig, resourcePath } from "@/services/api/apiConfig";
import { toApiError } from "@/services/api/errors";
import { db, resetDb } from "./database/db";
import { MockHttpError } from "./handlers/http";
import { router } from "./handlers";

/**
 * RTK Query base query that answers from the in-browser mock database instead of the network.
 * It speaks the same contract as the real backend (status codes, `{ data }` envelopes,
 * Laravel pagination, problem+json errors), so switching NEXT_PUBLIC_API_MODE changes nothing else.
 */

const failures: number[] = [];
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function queryOf(args: FetchArgs, url: string): Record<string, string> {
  const q: Record<string, string> = {};
  const qs = url.split("?")[1];
  if (qs) new URLSearchParams(qs).forEach((v, k) => (q[k] = v));
  for (const [k, v] of Object.entries((args.params ?? {}) as Record<string, unknown>)) if (v !== undefined && v !== null && v !== "") q[k] = String(v);
  return q;
}

export const mockBaseQuery: ApiBaseQuery = async (rawArgs, api) => {
  const args: FetchArgs = typeof rawArgs === "string" ? { url: rawArgs } : rawArgs;
  const method = (args.method ?? "GET").toUpperCase();
  const path = resourcePath(args.url);

  await wait(apiConfig.mock.delayMs * (1 + Math.random() * 0.5));
  if (api.signal.aborted) return { error: { status: 0, code: "aborted", message: "Request cancelled." } };

  const forced = failures.shift();
  if (forced || Math.random() < apiConfig.mock.failureRate) {
    return { error: toApiError(forced ?? 500, { code: "simulated_failure", detail: "Simulated server error (mock API)." }) };
  }

  const match = router.match(method, path);
  if (!match) return { error: toApiError(404, { code: "not_found", detail: `No mock handler for ${method} /${path}.` }) };

  const state = api.getState() as { auth?: { user?: { name?: string } | null } };
  try {
    const result = match.handler({
      method,
      path,
      params: match.params,
      query: queryOf(args, args.url),
      body: args.body === undefined ? undefined : structuredClone(args.body),
      user: state.auth?.user?.name ?? "eNGAS User",
    });
    const payload = result && typeof result === "object" && "__status" in result ? (result as unknown as { body: unknown }).body : result;
    // Hand out copies, as JSON over the wire would: callers can never mutate the database.
    return { data: payload === null || payload === undefined ? null : structuredClone(payload) };
  } catch (e) {
    if (e instanceof MockHttpError) return { error: toApiError(e.status, e.body) };
    console.error("[mock api]", method, path, e);
    return { error: toApiError(500, {}) };
  }
};

/** Dev helpers: `ngasMock.failNext(500)`, `ngasMock.failNext(422, 2)`, `ngasMock.reset()`, `ngasMock.db`. */
if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
  (window as unknown as { ngasMock: unknown }).ngasMock = {
    failNext(status = 500, times = 1) {
      for (let i = 0; i < times; i++) failures.push(status);
      return `Next ${times} mock request(s) will fail with ${status}.`;
    },
    reset() {
      resetDb();
      return "Mock database reset. Reload the page to refetch.";
    },
    get db() {
      return db;
    },
  };
}
