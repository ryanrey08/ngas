/**
 * httpOnly cookie holding the backend bearer token. Set and read only by the server routes in
 * src/app/api/backend; JavaScript in the browser cannot read it. Middleware checks only that it exists.
 */
export const AUTH_COOKIE = "ngas_token";
/** Old client-readable marker cookie from the pre-integration build; cleared on sign-in/out. */
export const LEGACY_SESSION_COOKIE = "ngas_session";
export const PERSIST_KEY = "ngas";

export const ROUTES = {
  login: "/login",
  forgotPassword: "/forgot-password",
  dashboard: "/dashboard",
  users: "/users",
  settings: "/settings",
} as const;

/** Route prefixes that require an authenticated session (enforced in middleware). */
export const PROTECTED_PREFIXES = [
  "/dashboard",
  "/double-entry",
  "/accrual",
  "/coa",
  "/journals",
  "/cash",
  "/receivables",
  "/payables",
  "/financial-reports",
  "/setup",
  "/users",
  "/settings",
];

export const AUTH_ROUTES = [ROUTES.login, ROUTES.forgotPassword];

/**
 * Auth routes of the real eNGAS backend (relative to the API base), used by the axios auth client.
 * Every other endpoint is defined next to its RTK Query hook in src/services/api/endpoints.
 * No forgot/reset password routes exist.
 */
export const API_ENDPOINTS = {
  auth: {
    login: "/auth/login",
    logout: "/auth/logout",
    me: "/auth/me",
  },
} as const;

export const OFFICES = [
  "Administrative Services",
  "Finance Office",
  "Accounting Unit",
  "Academic Affairs",
  "Research & Extension",
  "Student Services",
] as const;

export const DEFAULT_PAGE_SIZE = 10;
