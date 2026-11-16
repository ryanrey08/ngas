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

export const API_ENDPOINTS = {
  /** Real eNGAS backend routes (relative to the API base). No forgot/reset password routes exist. */
  auth: {
    login: "/auth/login",
    logout: "/auth/logout",
    me: "/auth/me",
  },
  dashboard: { summary: "/dashboard/summary" },
  journalEntries: "/journal-entries",
  accounts: "/coa/accounts",
  receivablesOverview: "/receivables/overview",
  payablesOverview: "/payables/overview",
  financialReports: "/financial-reports",
  notifications: "/notifications",
  users: "/users",
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
