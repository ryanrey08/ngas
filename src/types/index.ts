/** Frontend capabilities used to gate screens (mapped to backend permissions in config/navigation). */
export type Permission =
  | "dashboard:view"
  | "transactions:view"
  | "transactions:manage"
  | "budget:view"
  | "budget:manage"
  | "reports:view"
  | "users:manage"
  | "settings:view";

export interface ApiError {
  /** HTTP status, or 0 when no response was received. */
  status: number;
  /** Safe, user-facing message. Never contains stack traces or internals. */
  message: string;
  /** Stable machine code from the backend's problem+json body (e.g. `validation_failed`). */
  code?: string;
  /** Field errors from a 422 response. */
  errors?: Record<string, string[]>;
  /** Backend `request_id`, for support. */
  requestId?: string;
  /** Seconds to wait, from a 429 `Retry-After` header. */
  retryAfter?: number;
}

export type AsyncStatus = "idle" | "loading" | "succeeded" | "failed";

export interface Notification {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  type: "info" | "success" | "warning";
  href?: string;
}

export type SortDirection = "asc" | "desc";
