import axios, { AxiosError, type AxiosInstance } from "axios";
import { env } from "@/config/env";
import type { ApiError } from "@/types";
import { NETWORK_ERROR, TIMEOUT_ERROR, toApiError, type ProblemBody } from "@/services/api/errors";
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

/** Called by the RTK Query base query too, so a 401 from any request ends the session the same way. */
export function notifyUnauthorized() {
  onUnauthorized();
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
      return timedOut ? TIMEOUT_ERROR : NETWORK_ERROR;
    }

    const retryAfterHeader = Number(res.headers?.["retry-after"]);
    const retryAfter = Number.isFinite(retryAfterHeader) && retryAfterHeader > 0 ? retryAfterHeader : undefined;
    return toApiError(res.status, res.data, retryAfter);
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
