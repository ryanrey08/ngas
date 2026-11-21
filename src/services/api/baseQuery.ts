import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { notifyUnauthorized } from "@/lib/axios";
import type { ApiError } from "@/types";
import { apiConfig, shouldMock } from "./apiConfig";
import { NETWORK_ERROR, TIMEOUT_ERROR, toApiError } from "./errors";

export type ApiBaseQuery = BaseQueryFn<string | FetchArgs, unknown, ApiError>;

/**
 * Real HTTP transport. Requests go to the same-origin proxy (`/api/backend/*`), which adds
 * `Authorization: Bearer …` from the httpOnly cookie — so the browser never handles the token and
 * there is nothing secret to put in headers here. Cookies ride along via `credentials: "include"`.
 */
const rawFetch = fetchBaseQuery({
  baseUrl: apiConfig.baseUrl,
  credentials: "include",
  timeout: apiConfig.timeout,
  prepareHeaders: (headers, { getState }) => {
    headers.set("Accept", "application/json");
    // Agency/institution context for multi-institution backends (forwarded by the proxy).
    const institutionId = (getState() as { ui?: { institutionId?: string } }).ui?.institutionId;
    if (institutionId) headers.set("X-Institution-Id", institutionId);
    return headers;
  },
});

function normalize(error: FetchBaseQueryError, response?: Response): ApiError {
  const retryHeader = Number(response?.headers.get("retry-after"));
  const retryAfter = Number.isFinite(retryHeader) && retryHeader > 0 ? retryHeader : undefined;
  if (typeof error.status === "number") return toApiError(error.status, error.data, retryAfter);
  switch (error.status) {
    case "TIMEOUT_ERROR":
      return TIMEOUT_ERROR;
    case "FETCH_ERROR":
      return NETWORK_ERROR;
    case "PARSING_ERROR":
      return toApiError(error.originalStatus, undefined);
    default:
      return { status: 0, message: "An unexpected error occurred." };
  }
}

export const realBaseQuery: ApiBaseQuery = async (args, api, extra) => {
  const result = await rawFetch(args, api, extra);
  if (!result.error) return { data: result.data, meta: result.meta };
  const error = normalize(result.error, result.meta?.response);
  // The proxy has already cleared the cookie; end the session app-wide (same as the axios client).
  if (error.status === 401) notifyUnauthorized();
  return { error, meta: result.meta };
};

const urlOf = (args: string | FetchArgs) => (typeof args === "string" ? args : args.url);

/**
 * The one base query behind every endpoint: mock or real per request, decided centrally by
 * {@link shouldMock}. The mock server is loaded lazily, so real-mode bundles never execute it.
 * Real-mode failures are returned as errors — there is never a silent fallback to mock data.
 */
let mockModule: Promise<ApiBaseQuery> | null = null;
const loadMock = () =>
  (mockModule ??= import("@/mocks/mockBaseQuery").then((m) => m.mockBaseQuery ?? (m as unknown as { default: typeof m }).default.mockBaseQuery));

export const baseQuery: ApiBaseQuery = async (args, api, extra) => {
  if (!shouldMock(urlOf(args))) return realBaseQuery(args, api, extra);
  const mockBaseQuery = await loadMock();
  return mockBaseQuery(args, api, extra);
};
