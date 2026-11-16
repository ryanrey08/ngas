/** Demo roles used by the mock Users & Roles screen (the backend's real roles are in features/auth/types). */
export type Role = "admin" | "accountant" | "budget_officer" | "viewer";

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

/** A user record in the mock Users & Roles screen. */
export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  position: string;
  office: string;
  phone?: string;
}

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
