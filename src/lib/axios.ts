import axios, { AxiosError, type AxiosInstance } from "axios";
import { env } from "@/config/env";
import type { ApiError } from "@/types";
import { API_ENDPOINTS } from "./constants";

/**
 * The single axios instance for the app.
 *
 * It calls the same-origin proxy (`/api/backend/*`), which forwards to the eNGAS backend and adds
 * `Authorization: Bearer …` from the httpOnly `ngas_token` cookie. So there is no token handling here:
 * the browser never sees the token, and same-origin requests carry the cookie automatically.
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: env.apiTimeout,
  withCredentials: true,
  headers: { Accept: "application/json" },
});

type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler = () => {};

/** Registered once by the store provider (avoids a circular import between store and services). */
export function configureApiClient(options: { onUnauthorized: UnauthorizedHandler }) {
  onUnauthorized = options.onUnauthorized;
}

/** RFC 9457 problem+json body produced by the backend (and by our proxy for its own errors). */
interface ProblemBody {
  status?: number;
  code?: string;
  detail?: string;
  errors?: Record<string, string[]>;
  request_id?: string;
}

const FRIENDLY: Record<number, string> = {
  401: "Your session has expired. Please sign in again.",
  403: "You don't have permission to perform this action.",
  404: "The requested resource was not found.",
  429: "Too many requests. Please wait a moment and try again.",
};

function firstFieldError(errors?: Record<string, string[]>): string | undefined {
  if (!errors) return undefined;
  for (const messages of Object.values(errors)) if (messages?.[0]) return messages[0];
  return undefined;
}

/**
 * Converts any thrown value into a safe, user-facing {@link ApiError}.
 * 5xx details are never shown (the backend hides them too unless APP_DEBUG is on).
 */
export function normalizeError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const err = error as AxiosError<ProblemBody>;
    const res = err.response;

    if (!res) {
      const timedOut = err.code === "ECONNABORTED" || err.code === "ETIMEDOUT";
      return {
        status: 0,
        code: timedOut ? "timeout" : "network_error",
        message: timedOut
          ? "The server took too long to respond. Please try again."
          : "Unable to reach the server. Check your connection and try again.",
      };
    }

    const body = res.data && typeof res.data === "object" ? res.data : {};
    const status = res.status;
    const retryAfterHeader = Number(res.headers?.["retry-after"]);
    const retryAfter = Number.isFinite(retryAfterHeader) && retryAfterHeader > 0 ? retryAfterHeader : undefined;

    let message: string;
    if (status >= 500) {
      message =
        body.code === "backend_unavailable" || status === 502 || status === 503 || status === 504
          ? "The eNGAS service is currently unavailable. Please try again later."
          : "An unexpected server error occurred. Please try again.";
    } else if (status === 422) {
      message = firstFieldError(body.errors) ?? body.detail ?? "Please check the highlighted fields.";
    } else if (status === 429 && retryAfter) {
      message = `Too many attempts. Please wait ${retryAfter} second${retryAfter === 1 ? "" : "s"} and try again.`;
    } else {
      message = FRIENDLY[status] ?? body.detail ?? "The request could not be completed.";
    }

    return { status, message, code: body.code, errors: body.errors, requestId: body.request_id, retryAfter };
  }
  if (typeof error === "object" && error && "status" in error && "message" in error) return error as ApiError;
  return { status: 0, message: "An unexpected error occurred." };
}

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const normalized = normalizeError(error);
    const url = axios.isAxiosError(error) ? (error.config?.url ?? "") : "";
    // A 401 on login just means bad credentials; on logout the session is already gone.
    const isAuthCall = url.endsWith(API_ENDPOINTS.auth.login) || url.endsWith(API_ENDPOINTS.auth.logout);
    if (normalized.status === 401 && !isAuthCall) onUnauthorized();
    return Promise.reject(normalized);
  },
);
