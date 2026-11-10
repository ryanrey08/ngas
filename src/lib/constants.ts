export const SESSION_COOKIE = "ngas_session";
export const SESSION_MAX_AGE_REMEMBER = 60 * 60 * 24 * 30; // 30 days
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
  auth: {
    login: "/auth/login",
    logout: "/auth/logout",
    forgotPassword: "/auth/forgot-password",
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
