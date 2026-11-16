/**
 * Types for the eNGAS backend authentication API (`/api/v1/engas/auth/*`).
 * Shapes mirror the backend's `CurrentSystemUserResource` and `SystemAuthController`.
 * See docs/AUTH_API_INTEGRATION.md.
 */

/** Permission keys defined by the backend (`App\Enums\Permission`). */
export type BackendPermission =
  | "users.view"
  | "users.create"
  | "users.deactivate"
  | "roles.view"
  | "roles.manage"
  | "roles.assign"
  | "reports.view"
  | "reports.share";

/** Built-in role keys. Custom roles have `key: null`. */
export type BuiltInRoleKey = "super_admin" | "admin";

export interface AuthRole {
  id: string;
  key: BuiltInRoleKey | null;
  name: string;
}

/** The signed-in user as returned by `GET /auth/me` (`data`) and `POST /auth/login` (`user`). */
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
  system: { key: string; name: string };
  roles: AuthRole[];
  /** ISO 8601, or null before the first login. */
  last_login_at: string | null;
  created_at: string;
  is_super_admin: boolean;
  /** Effective permissions (super admins hold all of them). */
  permissions: BackendPermission[];
}

/** What the login form submits to the frontend. `remember` only controls the cookie lifetime. */
export interface LoginCredentials {
  email: string;
  password: string;
  remember: boolean;
}

/**
 * Response of the frontend's `POST /api/backend/auth/login` route. The backend's
 * `access_token` is kept server-side in an httpOnly cookie and never reaches the browser.
 */
export interface LoginResponse {
  user: AuthUser;
  /** ISO 8601 token expiry from the backend. */
  expires_at: string;
}

/** `GET /auth/me` response envelope. */
export interface MeResponse {
  data: AuthUser;
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  /** A login, logout or session check is in flight. */
  isLoading: boolean;
  /** The session has been checked at least once since the app loaded. */
  isInitialized: boolean;
  error: string | null;
}
