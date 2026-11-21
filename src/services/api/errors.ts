import type { ApiError } from "@/types";

/** RFC 9457 problem+json body produced by the backend (and by the Next.js proxy for its own errors). */
export interface ProblemBody {
  status?: number;
  code?: string;
  detail?: string;
  message?: string;
  errors?: Record<string, string[]>;
  request_id?: string;
}

const FRIENDLY: Record<number, string> = {
  401: "Your session has expired. Please sign in again.",
  403: "You don't have permission to perform this action.",
  404: "The requested resource was not found.",
  409: "This record was changed by someone else. Reload and try again.",
  429: "Too many requests. Please wait a moment and try again.",
};

function firstFieldError(errors?: Record<string, string[]>): string | undefined {
  if (!errors) return undefined;
  for (const messages of Object.values(errors)) if (messages?.[0]) return messages[0];
  return undefined;
}

/**
 * Converts an HTTP status + response body into the app's safe, user-facing {@link ApiError}.
 * Shared by the axios client (auth) and the RTK Query base query (everything else), so every
 * screen shows the same wording. 5xx details are never shown.
 */
export function toApiError(status: number, rawBody: unknown, retryAfter?: number): ApiError {
  const body: ProblemBody = rawBody && typeof rawBody === "object" ? (rawBody as ProblemBody) : {};
  let message: string;
  if (status >= 500) {
    message =
      body.code === "backend_unavailable" || status === 502 || status === 503 || status === 504
        ? "The eNGAS service is currently unavailable. Please try again later."
        : "An unexpected server error occurred. Please try again.";
  } else if (status === 422) {
    message = firstFieldError(body.errors) ?? body.detail ?? body.message ?? "Please check the highlighted fields.";
  } else if (status === 429 && retryAfter) {
    message = `Too many attempts. Please wait ${retryAfter} second${retryAfter === 1 ? "" : "s"} and try again.`;
  } else {
    message = FRIENDLY[status] ?? body.detail ?? body.message ?? "The request could not be completed.";
  }
  return { status, message, code: body.code, errors: body.errors, requestId: body.request_id, retryAfter };
}

export const NETWORK_ERROR: ApiError = {
  status: 0,
  code: "network_error",
  message: "Unable to reach the server. Check your connection and try again.",
};

export const TIMEOUT_ERROR: ApiError = {
  status: 0,
  code: "timeout",
  message: "The server took too long to respond. Please try again.",
};

export function isApiError(e: unknown): e is ApiError {
  return typeof e === "object" && e !== null && "status" in e && "message" in e && typeof (e as ApiError).message === "string";
}

/** Message for any error RTK Query can hand a component (ApiError, SerializedError, unknown). */
export function errorMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (!error) return fallback;
  if (isApiError(error)) return error.message;
  if (typeof error === "object" && "message" in error && typeof (error as { message: unknown }).message === "string") {
    return (error as { message: string }).message;
  }
  return fallback;
}

export function errorStatus(error: unknown): number | undefined {
  return isApiError(error) ? error.status : undefined;
}

/** Field errors from a 422, as `{ field: "first message" }` for react-hook-form's `setError`. */
export function fieldErrors(error: unknown): Record<string, string> {
  if (!isApiError(error) || !error.errors) return {};
  return Object.fromEntries(Object.entries(error.errors).map(([k, v]) => [k, v?.[0] ?? "Invalid value"]));
}
